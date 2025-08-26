package com.example.consumption_analyzer.repository;        /* package com.example.consumption_analyzer.repository;

import com.example.consumption_analyzer.DTO.CategorySummary;
import com.example.consumption_analyzer.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("SELECT new com.example.consumption_analyzer.dto.CategorySummary(c.name, SUM(t.amount)) " +
            "FROM Transaction t JOIN t.category c " +
            "GROUP BY c.name " +
            "ORDER BY SUM(t.amount) DESC")
    List<CategorySummary> getCategorySummaries();
} */

import com.example.consumption_analyzer.DTO.CategorySummary;
import com.example.consumption_analyzer.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // 이 부분을 추가하거나 수정하세요.
    // TransactionRepository.java 내부
    @Query("SELECT new com.example.consumption_analyzer.DTO.CategorySummary(c.name, SUM(t.amount)) " +
            "FROM Transaction t JOIN t.category c " +
            "GROUP BY c.name")
    List<CategorySummary> getCategorySummaries();
}


