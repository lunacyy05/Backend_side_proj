package com.example.consumption_analyzer.repository;

import com.example.consumption_analyzer.DTO.CategorySummary;
import com.example.consumption_analyzer.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.type = 'income'")
    Long getTotalIncome();

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.type = 'expense'")
    Long getTotalExpense();

    @Query("SELECT new com.example.consumption_analyzer.DTO.CategorySummary(c.name, SUM(t.amount)) " +
            "FROM Transaction t JOIN t.category c WHERE t.type = 'expense' GROUP BY c.name")
    List<CategorySummary> getCategorySummaries();
}


