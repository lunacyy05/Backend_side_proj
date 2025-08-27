package com.example.consumption_analyzer.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data; // @Getter, @Setter, @ToString 등을 합친 어노테이션입니다.

import java.time.LocalDate;

@Data // ◀◀◀ @Getter와 @Setter를 @Data로 변경
public class TransactionRequestDTO {

    @NotNull(message = "날짜는 필수입니다.") // ◀◀◀ 날짜는 null일 수 없음
    private LocalDate date;

    @NotBlank(message = "카테고리는 필수입니다.") // ◀◀◀ 카테고리는 null이거나 빈 문자열일 수 없음
    private String category;

    @Positive(message = "금액은 0보다 커야 합니다.") // ◀◀◀ 금액은 반드시 양수여야 함
    private int amount;

    // 'type' 필드는 컨트롤러에서 직접 설정하므로 유효성 검사가 필요 없습니다.
    private String type;
}