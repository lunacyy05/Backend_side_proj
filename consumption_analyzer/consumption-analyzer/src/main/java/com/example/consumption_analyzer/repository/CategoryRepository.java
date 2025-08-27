package com.example.consumption_analyzer.repository;

import com.example.consumption_analyzer.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional; // Optional 임포트

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // [추가] 이 메소드를 추가해주세요.
    // 카테고리 이름(name)으로 Category 객체를 찾아주는 기능을 합니다.
    Optional<Category> findByName(String name);
}