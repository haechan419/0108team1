package com.Team1_Back.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailsDTO {

    private Long id;
    private String employeeNo;
    private String name;
    private String email;
    private LocalDate birthDate;
    private String phone;
    private String address;
    private String addressDetail;
    private String departmentName;
    private String positionName;
    private boolean isLocked;
    private boolean isActive;
    private LocalDateTime createdUserAt;
    private LocalDateTime updatedUserAt;
}
