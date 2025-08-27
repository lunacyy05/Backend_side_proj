package com.example.consumption_analyzer.model;

import jakarta.persistence.*;
import lombok.*; // lombok.* 임포트

import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor // ◀◀◀ Builder는 모든 필드를 갖는 생성자가 필요합니다.
@Builder // ◀◀◀ 빌더 패턴을 사용하기 위해 추가합니다.
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int amount;
    private LocalDate date;
    private String type;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;
}