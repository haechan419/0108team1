package com.Team1_Back.ai.service;

import com.Team1_Back.ai.OllamaProperties;
import com.Team1_Back.ai.dto.OllamaGenerateRequestDTO;
import com.Team1_Back.ai.dto.OllamaGenerateResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiServiceImpl implements AiService {

    private final RestClient ollamaRestClient;
    private final OllamaProperties props;

    @Override
    public String generate(String prompt) {

        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("prompt is blank");
        }

        OllamaGenerateRequestDTO req = new OllamaGenerateRequestDTO();
        req.setModel(props.getModel());
        req.setPrompt(prompt);
        req.setStream(false); // ★ 중요

        try {
            OllamaGenerateResponseDTO res = ollamaRestClient.post()
                    .uri("/api/generate")
                    .body(req)
                    .retrieve()
                    .body(OllamaGenerateResponseDTO.class);

            if (res == null) {
                throw new RuntimeException("ollama response is null");
            }
            if (res.getError() != null && !res.getError().isBlank()) {
                throw new RuntimeException("ollama error: " + res.getError());
            }
            if (res.getResponse() == null) {
                throw new RuntimeException("ollama response.text is null");
            }

            return res.getResponse();

        } catch (Exception e) {
            log.error("[AI] Ollama call failed", e);
            throw new RuntimeException("AI generate failed", e);
        }
    }
}
