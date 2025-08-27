package com.example.consumption_analyzer.model;

import jakarta.persistence.*; // 이 import문이 있는지 확인하세요
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "categories") // ◀◀◀ 테이블 이름을 명시하기 위해 이 라인을 추가하세요
@Getter
@Setter
@NoArgsConstructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 'name' 열에는 'salary', 'food' 등과 같은 키가 저장됩니다.
    private String name;

    // 여기에 Transaction과의 일대다 관계가 있을 수 있습니다
    // @OneToMany(mappedBy = "category")
    // private List<Transaction> transactions;
}