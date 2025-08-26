package com.example.consumption_analyzer.controller;

import com.example.consumption_analyzer.DTO.CategorySummary;
import com.example.consumption_analyzer.model.Category;
import com.example.consumption_analyzer.model.Transaction;
import com.example.consumption_analyzer.repository.CategoryRepository;
import com.example.consumption_analyzer.repository.TransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    public ApiController(TransactionRepository transactionRepository, CategoryRepository categoryRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
    }

    // 엔드포인트 1: 모든 카테고리 목록 조회
    @GetMapping("/categories")
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    // 엔드포인트 2: 새로운 거래 내역 생성
    @PostMapping("/transactions")
    public ResponseEntity<Transaction> createTransaction(@RequestBody Transaction transaction) {
        // 실제 애플리케이션에서는 입력값 검증(validation)이 필요
        transaction.setTransactionDate(LocalDate.now()); // 서버 시간 기준으로 날짜 설정
        Transaction savedTransaction = transactionRepository.save(transaction);
        return new ResponseEntity<>(savedTransaction, HttpStatus.CREATED);
    }

    // 엔드포인트 3: 카테고리별 지출 요약 데이터 조회
    @GetMapping("/transactions/summary-by-category")
    public List<CategorySummary> getTransactionSummary() {
        return transactionRepository.getCategorySummaries();
    }
}