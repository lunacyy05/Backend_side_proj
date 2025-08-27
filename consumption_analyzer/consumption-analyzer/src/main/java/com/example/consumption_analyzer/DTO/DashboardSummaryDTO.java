package com.example.consumption_analyzer.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.Map;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDTO {
    private Long totalIncome;
    private Long totalExpense;
    private Map<String, Long> expenseByCategory;
}