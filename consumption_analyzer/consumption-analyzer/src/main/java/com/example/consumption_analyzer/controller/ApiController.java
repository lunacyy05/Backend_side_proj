package com.example.consumption_analyzer.controller;

import jakarta.validation.Valid;
import com.example.consumption_analyzer.DTO.CategorySummary;
import com.example.consumption_analyzer.DTO.TransactionRequestDTO;
import com.example.consumption_analyzer.model.Category;
import com.example.consumption_analyzer.model.Transaction;
import com.example.consumption_analyzer.repository.CategoryRepository;
import com.example.consumption_analyzer.repository.TransactionRepository;
import com.example.consumption_analyzer.service.TransactionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.consumption_analyzer.DTO.DashboardSummaryDTO;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ApiController {

    private final TransactionService transactionService;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    public ApiController(TransactionService transactionService, CategoryRepository categoryRepository, TransactionRepository transactionRepository) {
        this.transactionService = transactionService;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
    }

    // --- Category API ---
    @GetMapping("/categories")
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    // --- Transaction API (CRUD) ---

    // 1. 모든 거래 내역 조회 (Read)
    @GetMapping("/transactions")
    public List<Transaction> getAllTransactions() {
        return transactionService.getAllTransactions();
    }

    // [수정] 2. '수입' 거래 내역 생성 (Create)
    @PostMapping("/transactions/income")
    public ResponseEntity<Transaction> createIncomeTransaction(@Valid @RequestBody TransactionRequestDTO requestDTO) { // ◀◀◀ @Valid 추가
        requestDTO.setType("income");
        Transaction createdTransaction = transactionService.createTransaction(requestDTO);
        return new ResponseEntity<>(createdTransaction, HttpStatus.CREATED);
    }

    // [추가] 3. '지출' 거래 내역 생성 (Create)
    @PostMapping("/transactions/expense")
    public ResponseEntity<Transaction> createExpenseTransaction(@Valid @RequestBody TransactionRequestDTO requestDTO) { // ◀◀◀ @Valid 추가
        requestDTO.setType("expense");
        Transaction createdTransaction = transactionService.createTransaction(requestDTO);
        return new ResponseEntity<>(createdTransaction, HttpStatus.CREATED);
    }

    // 4. 특정 거래 내역 삭제 (Delete)
    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }

    // --- 통계 API ---
    // [수정] 5. 통계 요약 조회
    @GetMapping("/summary")
    public DashboardSummaryDTO getTransactionSummary() {
        return transactionService.getDashboardSummary();
    }

    @PostMapping("/data/reset")
    public ResponseEntity<Void> resetData() {
        transactionService.resetAllData();
        return ResponseEntity.ok().build();
    }
}