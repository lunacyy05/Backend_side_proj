package com.example.consumption_analyzer.config;

import com.example.consumption_analyzer.model.Category;
import com.example.consumption_analyzer.repository.CategoryRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer {

    private final CategoryRepository categoryRepository;

    public DataInitializer(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @PostConstruct
    public void initData() {
        // 프론트엔드에서 사용하는 카테고리 키 목록
        List<String> categoryNames = Arrays.asList(
                "salary", "bonus", "investment", "communication", "transportation",
                "savings", "living", "food", "medical", "etc"
        );

        for (String name : categoryNames) {
            // DB에 해당 이름의 카테고리가 없는 경우에만 새로 생성하여 저장
            if (categoryRepository.findByName(name).isEmpty()) {
                Category newCategory = new Category();
                newCategory.setName(name);
                categoryRepository.save(newCategory);
            }
        }
    }
}