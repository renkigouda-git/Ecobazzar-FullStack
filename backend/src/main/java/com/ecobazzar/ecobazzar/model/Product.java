package com.ecobazzar.ecobazzar.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String details;

    private Double price;
    private Double carbonImpact;
    private String imageUrl;

    // ✅ Use Boolean wrapper only
    @Column(nullable = false)
    private Boolean ecoCertified = false;

    @Column(nullable = false)
    private Boolean ecoRequested = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    @JsonIgnore
    private User seller;

    // ---------- ID ----------
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    // ---------- NAME ----------
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    // ---------- DETAILS ----------
    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    // ---------- PRICE ----------
    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    // ---------- CARBON ----------
    public Double getCarbonImpact() {
        return carbonImpact;
    }

    public void setCarbonImpact(Double carbonImpact) {
        this.carbonImpact = carbonImpact;
    }

    // ---------- IMAGE ----------
    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    // ---------- ECO CERTIFIED ----------
    public Boolean getEcoCertified() {
        return ecoCertified != null ? ecoCertified : false;
    }

    public void setEcoCertified(Boolean ecoCertified) {
        this.ecoCertified = ecoCertified != null ? ecoCertified : false;
    }

    // ---------- ECO REQUESTED ----------
    public Boolean getEcoRequested() {
        return ecoRequested != null ? ecoRequested : false;
    }

    public void setEcoRequested(Boolean ecoRequested) {
        this.ecoRequested = ecoRequested != null ? ecoRequested : false;
    }

    // ---------- SELLER ----------
    public User getSeller() {
        return seller;
    }

    public void setSeller(User seller) {
        this.seller = seller;
    }

    public Long getSellerId() {
        return seller != null ? seller.getId() : null;
    }

    public void setSellerId(Long sellerId) {
        // intentionally empty
    }
}
