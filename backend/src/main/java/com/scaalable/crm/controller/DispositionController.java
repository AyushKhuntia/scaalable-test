package com.scaalable.crm.controller;

import com.scaalable.crm.entity.Disposition;
import com.scaalable.crm.repository.DispositionRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dispositions")
public class DispositionController {

    private final DispositionRepository repository;

    public DispositionController(DispositionRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Disposition> all() {
        return repository.findAll();
    }
}
