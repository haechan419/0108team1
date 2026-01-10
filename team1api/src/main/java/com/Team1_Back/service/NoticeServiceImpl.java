package com.Team1_Back.service;


import com.Team1_Back.domain.Notice;
import com.Team1_Back.domain.NoticeFile;
import com.Team1_Back.dto.PageRequestDTO;
import com.Team1_Back.dto.PageResponseDTO;
import com.Team1_Back.dto.NoticeDTO;
import com.Team1_Back.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@Log4j2
@RequiredArgsConstructor
public class NoticeServiceImpl implements NoticeService {

    private final ModelMapper modelMapper;

    private final NoticeRepository noticeRepository;

    @Override
    public Long register(NoticeDTO noticeDTO) {
        log.info("---register---");
        Notice notice = modelMapper.map(noticeDTO, Notice.class);

        // 파일 처리
        if (noticeDTO.getFiles() != null) {
            noticeDTO.getFiles().forEach(file -> {
                String uuid = UUID.randomUUID().toString();
                String savedName = uuid + "_" + file.getOriginalFilename();

                Path savePath = Paths.get("C:/upload/notice/" + savedName);

                try {
                    Files.createDirectories(savePath.getParent());
                    file.transferTo(savePath.toFile());
                }catch(Exception e) {

                }

                NoticeFile noticeFile = NoticeFile.builder()
                        .originalFileName(file.getOriginalFilename())
                        .savedFileName(savedName)
                        .filePath(savePath.toString())
                        .fileSize(file.getSize())
                        .build();

                notice.addFile(noticeFile);
            });
        }

        Notice savedNotice = noticeRepository.save(notice);

        return savedNotice.getNno();
    }

    @Override
    public PageResponseDTO<NoticeDTO> getList(PageRequestDTO pageRequestDTO) {
        log.info("---list---");

        PageRequest pageable = PageRequest.of(
                pageRequestDTO.getPage() - 1,
                pageRequestDTO.getSize()
        );

        Page<Notice> savedNotice = noticeRepository.findNoticePage(pageable);

        List<NoticeDTO> dtoList = savedNotice.getContent()
                .stream()
                .map(notice -> modelMapper.map(notice, NoticeDTO.class))
                .collect(Collectors.toList());
        return PageResponseDTO.<NoticeDTO>withAll()
                .dtoList(dtoList)
                .pageRequestDTO(pageRequestDTO)
                .totalCount(savedNotice.getTotalElements())
                .build();
    }

    @Override
    public NoticeDTO get(Long nno) {
        log.info("---get---");
        Optional<Notice> savedNotice = noticeRepository.findById(nno);
        savedNotice.orElseThrow();
        NoticeDTO dto = modelMapper.map(savedNotice, NoticeDTO.class);
        return dto;
    }

    @Override
    public void modify(NoticeDTO noticeDTO) {
        log.info("---modify---");
        Optional<Notice> savedNotice = noticeRepository.findById(noticeDTO.getNno());

        Notice notice = savedNotice.orElseThrow();

        notice.changeTitle(noticeDTO.getTitle());
        notice.changePinned(noticeDTO.isPinned());
        notice.changeContent(noticeDTO.getContent());

        noticeRepository.save(notice);

    }

    @Override
    public void delete(Long nno) {
        log.info("---delete---");
        Optional<Notice> savedNotice = noticeRepository.findById(nno);
        Notice notice = savedNotice.orElseThrow();

        notice.delete();
    }
}
