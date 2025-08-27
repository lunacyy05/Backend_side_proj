package com.example.consumption_analyzer.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CategorySummary {

    private String categoryName;
    private Long totalAmount;

    // 직접 작성했던 생성자와 Setter 메소드를 모두 삭제합니다.
    // Lombok이 어노테이션을 통해 자동으로 필요한 메소드들을 만들어주기 때문입니다.
}