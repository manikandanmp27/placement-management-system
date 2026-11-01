package com.example.placement_management_system.config;

import com.example.placement_management_system.service.DemoAccountService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(10)
public class DemoAccountInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DemoAccountInitializer.class);

    private final DemoAccountService demoAccountService;

    public DemoAccountInitializer(DemoAccountService demoAccountService) {
        this.demoAccountService = demoAccountService;
    }

    @Override
    public void run(String... args) {
        if (demoAccountService.isDemoEnabled()) {
            logger.info("Initializing demo accounts and sample data...");
            demoAccountService.initDemoAccountsAndData();
        } else {
            logger.info("Demo accounts are disabled via configuration.");
        }
    }
}
