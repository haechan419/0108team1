package com.Team1_Back.service;

import com.Team1_Back.domain.Role;
import com.Team1_Back.domain.User;
import com.Team1_Back.dto.*;
import com.Team1_Back.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public PageResponseDTO<UserListDTO> getUsers(PageRequestDTO request) {

        Pageable pageable = PageRequest.of(
                request.getPage() - 1,
                request.getSize(),
                Sort.by("createdUserAt").descending()
        );

        Page<UserListDTO> result = userRepository.searchUsers(request, pageable);
        List<String> departments = userRepository.findAllDepartments();

        return PageResponseDTO.<UserListDTO>builder()
                .content(result.getContent())
                .page(request.getPage())
                .size(request.getSize())
                .totalElements(result.getTotalElements())
                .totalPage(result.getTotalPages())
                .next(result.hasNext())
                .prev(result.hasPrevious())
                .departments(departments)
                .build();
    }

    @Override
    public UserDetailsDTO getUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사원을 찾을 수 없습니다: " + id));

        return UserDetailsDTO.builder()
                .id(user.getId())
                .employeeNo(user.getEmployeeNo())
                .name(user.getName())
                .email(user.getEmail())
                .birthDate(user.getBirthDate())
                .phone(user.getPhone())
                .address(user.getAddress())
                .addressDetail(user.getAddressDetail())
                .departmentName(user.getDepartmentName())
                .positionName(user.getPosition())
                .isLocked(user.isLocked())
                .isActive(user.getIsActive())
                .createdUserAt(user.getCreatedUserAt())
                .updatedUserAt(user.getUpdatedUserAt())
                .build();
    }

    @Override
    @Transactional
    public Long createUser(UserCreateDTO dto) {

        if (userRepository.existsByEmployeeNo(dto.getEmployeeNo())) {
            throw new RuntimeException("이미 존재하는 사번입니다: " + dto.getEmployeeNo());
        }

        User user = User.builder()
                .employeeNo(dto.getEmployeeNo())
                .password(passwordEncoder.encode(dto.getPassword()))
                .name(dto.getName())
                .email(dto.getEmail())
                .birthDate(dto.getBirthDate())
                .phone(dto.getPhone())
                .address(dto.getAddress())
                .addressDetail(dto.getAddressDetail())
                .departmentName(dto.getDepartmentName())
                .position(dto.getPositionName())
                .role(Role.valueOf(dto.getRole()))
                .build();

        User saved = userRepository.save(user);
        return saved.getId();
    }

    @Override
    @Transactional
    public void updateUser(Long id, UserUpdateDTO dto) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사원을 찾을 수 없습니다: " + id));

        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setBirthDate(dto.getBirthDate());
        user.setPhone(dto.getPhone());
        user.setAddress(dto.getAddress());
        user.setAddressDetail(dto.getAddressDetail());
        user.setDepartmentName(dto.getDepartmentName());
        user.setPosition(dto.getPosition());

        if (dto.getRole() != null) {
            user.setRole(Role.valueOf(dto.getRole()));
        }

        if (dto.getNewPassword() != null && !dto.getNewPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        }
    }

    @Override
    @Transactional
    public void resignUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사원을 찾을 수 없습니다: " + id));

        user.setIsActive(false);
        user.lock();
    }

    @Override
    @Transactional
    public void unlockUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사원을 찾을 수 없습니다: " + id));

        user.unlock();
    }
}
