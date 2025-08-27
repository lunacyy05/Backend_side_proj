package com.example.consumption_analyzer.service;

import com.example.consumption_analyzer.DTO.CategorySummary;
import com.example.consumption_analyzer.DTO.DashboardSummaryDTO;
import com.example.consumption_analyzer.DTO.TransactionRequestDTO;
import com.example.consumption_analyzer.model.Category;
import com.example.consumption_analyzer.model.Transaction;
import com.example.consumption_analyzer.repository.CategoryRepository;
import com.example.consumption_analyzer.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// [리팩터링] 불필요한 import 제거

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    public TransactionService(TransactionRepository transactionRepository, CategoryRepository categoryRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @Transactional
    public Transaction createTransaction(TransactionRequestDTO requestDTO) {
        Category category = categoryRepository.findByName(requestDTO.getCategory())
                .orElseThrow(() -> new IllegalArgumentException("Invalid category: " + requestDTO.getCategory()));

        // [리팩터링] 빌더 패턴을 사용하여 객체 생성
        Transaction newTransaction = Transaction.builder()
                .amount(requestDTO.getAmount())
                .date(requestDTO.getDate())
                .type(requestDTO.getType())
                .category(category)
                .build();

        return transactionRepository.save(newTransaction);
    }

    @Transactional
    public void deleteTransaction(Long id) {
        if (!transactionRepository.existsById(id)) {
            throw new IllegalArgumentException("Transaction not found with id: " + id);
        }
        transactionRepository.deleteById(id);
    }

    public DashboardSummaryDTO getDashboardSummary() {
        Long totalIncome = transactionRepository.getTotalIncome();
        Long totalExpense = transactionRepository.getTotalExpense();

        Map<String, Long> expenseByCategory = transactionRepository.getCategorySummaries().stream()
                .collect(Collectors.toMap(CategorySummary::getCategoryName, CategorySummary::getTotalAmount));

        return new DashboardSummaryDTO(totalIncome, totalExpense, expenseByCategory);
    }

    @Transactional
    public void resetAllData() {
        transactionRepository.deleteAll();
    }
}