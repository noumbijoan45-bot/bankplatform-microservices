package com.bankplatform.account.controller;

import com.bankplatform.account.dto.AccountResponse;
import com.bankplatform.account.dto.OpenAccountRequest;
import com.bankplatform.account.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/accounts")
public class AccountController {

    private final AccountService accountService;

    @Autowired
    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    // Ouvrir un compte
    @PostMapping
    public ResponseEntity<AccountResponse> openAccount(
            @Valid @RequestBody OpenAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(accountService.openAccount(request));
    }

    // Obtenir tous les comptes
    @GetMapping
    public ResponseEntity<List<AccountResponse>> getAllAccounts() {
        return ResponseEntity.ok(accountService.getAllAccounts());
    }

    // Obtenir un compte par ID
    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> getAccountById(@PathVariable UUID id) {
        return ResponseEntity.ok(accountService.getAccountById(id));
    }

    // Obtenir un compte par numéro
    @GetMapping("/number/{accountNumber}")
    public ResponseEntity<AccountResponse> getAccountByNumber(
            @PathVariable String accountNumber) {
        return ResponseEntity.ok(accountService.getAccountByNumber(accountNumber));
    }

    // Obtenir les comptes d'un client
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<AccountResponse>> getAccountsByCustomer(
            @PathVariable UUID customerId) {
        return ResponseEntity.ok(accountService.getAccountsByCustomer(customerId));
    }

    // Obtenir les comptes d'un opérateur
    @GetMapping("/operator/{operatorId}")
    public ResponseEntity<List<AccountResponse>> getAccountsByOperator(
            @PathVariable UUID operatorId) {
        return ResponseEntity.ok(accountService.getAccountsByOperator(operatorId));
    }

    // Débiter un compte (appelé par transaction-service)
    @PostMapping("/{id}/debit")
    public ResponseEntity<AccountResponse> debit(
            @PathVariable UUID id,
            @RequestBody Map<String, BigDecimal> body) {
        return ResponseEntity.ok(accountService.debit(id, body.get("amount")));
    }

    // Créditer un compte (appelé par transaction-service)
    @PostMapping("/{id}/credit")
    public ResponseEntity<AccountResponse> credit(
            @PathVariable UUID id,
            @RequestBody Map<String, BigDecimal> body) {
        return ResponseEntity.ok(accountService.credit(id, body.get("amount")));
    }

    // Fermer un compte
    @PostMapping("/{id}/close")
    public ResponseEntity<Void> closeAccount(@PathVariable UUID id) {
        accountService.closeAccount(id);
        return ResponseEntity.ok().build();
    }

    // Bloquer un compte
    @PostMapping("/{id}/freeze")
    public ResponseEntity<Void> freezeAccount(@PathVariable UUID id) {
        accountService.freezeAccount(id);
        return ResponseEntity.ok().build();
    }

    // Health check
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "account-service"));
    }
}
