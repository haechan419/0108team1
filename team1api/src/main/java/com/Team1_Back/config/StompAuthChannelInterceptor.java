package com.Team1_Back.config;

import com.Team1_Back.service.ChatRoomSecurityService;
import com.Team1_Back.util.CustomJWTException;
import com.Team1_Back.util.JWTUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final ChatRoomSecurityService chatRoomSecurityService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor acc =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (acc == null) return message;

        StompCommand cmd = acc.getCommand();
        if (cmd == null) return message;

        // =========================================================
        // 1) CONNECT: JWT 검증 + Principal(userId) 세팅
        // =========================================================
        if (StompCommand.CONNECT.equals(cmd)) {

            String auth = acc.getFirstNativeHeader("Authorization");
            if (auth == null || !auth.startsWith("Bearer ")) {
                log.warn("[STOMP] CONNECT missing Authorization header");
                throw new MessagingException("Missing Authorization Bearer token in STOMP CONNECT");
            }

            String token = auth.substring("Bearer ".length()).trim();

            try {
                // ✅ 1) JWT 검증
                Map<String, Object> claims = JWTUtil.validateToken(token);

                // ✅ 2) userId 추출 (id 우선, 없으면 sub도 숫자일 경우 커버)
                Long uid = toLong(claims.get("id"));
                if (uid == null) {
                    uid = toLong(claims.get("sub"));
                }

                if (uid == null) {
                    log.warn("[STOMP] CONNECT claims missing numeric id/sub. claimsKeys={}", claims.keySet());
                    throw new MessagingException("JWT claims missing numeric user id (id/sub)");
                }

                // ✅ 3) Principal 세팅
                final String principalName = String.valueOf(uid);
                Principal principal = () -> principalName;
                acc.setUser(principal);

                log.info("[STOMP] CONNECT OK userId={}", principalName);

            } catch (CustomJWTException e) {
                log.warn("[STOMP] CONNECT JWT invalid: {}", e.getMessage());
                throw new MessagingException("Invalid JWT token: " + e.getMessage(), e);
            }
        }

        // =========================================================
        // 2) SUBSCRIBE: /topic/room/{roomId}(+suffix) 구독 권한 체크
        //    - /topic/room/20
        //    - /topic/room/20/read
        //    - /topic/room/20/meta ...
        // =========================================================
        if (StompCommand.SUBSCRIBE.equals(cmd)) {
            Long meId = currentUserId(acc);
            String dest = acc.getDestination();

            // 디버깅용: 어떤 구독이 들어오는지 무조건 찍어두면 삽질 끝남
            log.info("[STOMP] SUBSCRIBE userId={} dest={}", meId, dest);

            if (dest != null && dest.startsWith("/topic/room/")) {

                Long roomId = parseRoomId(dest, "/topic/room/");
                if (roomId == null) {
                    // 정책 선택:
                    // - 개발단계에서는 세션 튕김을 막기 위해 throw 대신 warn + 통과도 가능
                    // - 하지만 보안상 엄격하게 하려면 throw 유지
                    log.warn("[STOMP] SUBSCRIBE invalid room destination. userId={} dest={}", meId, dest);
                    throw new MessagingException("Invalid room destination: " + dest);
                }

                log.info("[STOMP] SUBSCRIBE meId={}, dest={}", acc.getUser() != null ? acc.getUser().getName() : null, acc.getDestination());

                boolean ok = chatRoomSecurityService.isMember(meId, roomId);
                if (!ok) {

                    log.warn("[STOMP] SUBSCRIBE DENIED meId={}, roomId={}, dest={}", meId, roomId, dest);

                    throw new MessagingException("Not allowed to subscribe room=" + roomId);
                }

                log.info("[STOMP] SUBSCRIBE allowed. userId={} roomId={}", meId, roomId);
            }

            // (선택) /user/queue/** 는 원래 "본인만" 수신되지만,
            // 잘못된 구독을 막고 싶으면 여기서 dest 규칙 검증을 더 추가할 수 있음.
        }

        // =========================================================
        // 3) SEND: 필요하면 /app/**도 검사 가능 (현재는 생략)
        // =========================================================

        return message;
    }

    private Long currentUserId(StompHeaderAccessor acc) {
        if (acc.getUser() == null || acc.getUser().getName() == null) {
            throw new MessagingException("Unauthenticated STOMP session");
        }
        try {
            return Long.valueOf(acc.getUser().getName());
        } catch (Exception e) {
            throw new MessagingException(
                    "Invalid principal name (not numeric userId): " + acc.getUser().getName(), e
            );
        }
    }

    /**
     * ✅ 핵심 수정:
     * /topic/room/{roomId} 뿐 아니라
     * /topic/room/{roomId}/read 같은 suffix가 있어도 roomId만 뽑아내기.
     */
    private Long parseRoomId(String dest, String prefix) {
        try {
            String rest = dest.substring(prefix.length()); // e.g. "20/read" or "20"
            int slash = rest.indexOf('/');
            String idPart = (slash >= 0) ? rest.substring(0, slash) : rest; // "20"
            return Long.valueOf(idPart);
        } catch (Exception e) {
            return null;
        }
    }

    private Long toLong(Object v) {
        if (v == null) return null;
        if (v instanceof Long l) return l;
        if (v instanceof Integer i) return i.longValue();
        if (v instanceof String s) {
            s = s.trim();
            if (s.isEmpty() || "null".equalsIgnoreCase(s)) return null;
            try {
                return Long.valueOf(s);
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }
}
