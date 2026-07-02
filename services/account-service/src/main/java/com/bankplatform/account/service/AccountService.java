package com.bankplatform.account.service;

import com.bankplatform.account.dto.AccountResponse;
import com.bankplatform.account.dto.OpenAccountRequest;
import com.bankplatform.account.entity.Account;
import com.bankplatform.account.entity.AccountStatus;
import com.bankplatform.account.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AccountService {

    private final AccountRepository accountRepository;

    @Autowired
    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    // Génère un numéro de compte unique
    private String generateAccountNumber() {
        String number;
        do {
            number = "BNK" + System.currentTimeMillis() + (int)(Math.random() * 1000);
        } while (accountRepository.existsByAccountNumber(number));
        return number;
    }

    @Transactional
    public AccountResponse openAccount(OpenAccountRequest request) {
        Account account = Account.builder()
                .accountNumber(generateAccountNumber())
                .customerId(request.getCustomerId())
                .operatorId(request.getOperatorId())
                .type(request.getType())
                .balance(request.getInitialDeposit() != null ? request.getInitialDeposit() : BigDecimal.ZERO)
                .currency(request.getCurrency() != null ? request.getCurrency() : "XOF")
                .dailyLimit(request.getDailyLimit() != null ? request.getDailyLimit() : new BigDecimal("1000000"))
                .monthlyLimit(request.getMonthlyLimit() != null ? request.getMonthlyLimit() : new BigDecimal("5000000"))
                .status(AccountStatus.ACTIVE)
                .build();

        return AccountResponse.from(accountRepository.save(account));
    }

    public AccountResponse getAccountById(UUID id) {
        return AccountResponse.from(accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compte introuvable : " + id)));
    }

    public AccountResponse getAccountByNumber(String accountNumber) {
        return AccountResponse.from(accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Compte introuvable : " + accountNumber)));
    }

    public List<AccountResponse> getAllAccounts() {
        return accountRepository.findAll()
                .stream().map(AccountResponse::from).collect(Collectors.toList());
    }

    public List<AccountResponse> getAccountsByCustomer(UUID customerId) {
        return accountRepository.findByCustomerId(customerId)
                .stream().map(AccountResponse::from).collect(Collectors.toList());
    }

    public List<AccountResponse> getAccountsByOperator(UUID operatorId) {
        return accountRepository.findByOperatorId(operatorId)
                .stream().map(AccountResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public AccountResponse debit(UUID id, BigDecimal amount) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compte introuvable : " + id));

        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalStateException("Compte inactif");
        }
        if (account.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Solde insuffisant");
        }

        account.setBalance(account.getBalance().subtract(amount));
        return AccountResponse.from(accountRepository.save(account));
    }

    @Transactional
    public AccountResponse credit(UUID id, BigDecimal amount) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compte introuvable : " + id));

        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalStateException("Compte inactif");
        }

        account.setBalance(account.getBalance().add(amount));
        return AccountResponse.from(accountRepository.save(account));
    }

    @Transactional
    public void closeAccount(UUID id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compte introuvable : " + id));
        account.setStatus(AccountStatus.CLOSED);
        accountRepository.save(account);
    }

    @Transactional
    public void freezeAccount(UUID id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compte introuvable : " + id));
        account.setStatus(AccountStatus.FROZEN);
        accountRepository.save(account);
    }
}
