# Remix of QuotaSystemNew

PROJECT NAME: QUOTA

PRODUCT OVERVIEW:
Design and generate a complete fintech-grade SaaS billing and invoicing platform called “Quota”, built specifically for the Mozambican market. The platform must feel modern, lightweight, mobile-first, AI-powered, and extremely easy to use for SMEs, retail businesses, service providers, construction companies, logistics companies, and entrepreneurs with little accounting experience.

Quota must combine:

Minimalist UX

Intelligent automation

WhatsApp-first communication

Smart invoicing

Multi-company SaaS management

AI-assisted workflows

Real-time document verification

Mobile + Web experience

Offline-first capability

The product should feel like:
“Stripe + Notion + Revolut Business + WhatsApp for African SMEs.”

CORE PRODUCT PHILOSOPHY:
The goal is NOT to build a complicated ERP.

The goal is:

Fast workflows

Minimal clicks

Friendly design

Smart automation

Premium fintech interface

Very easy onboarding

Mobile-first simplicity

The system must be usable by someone with little technical or accounting knowledge.

PRIMARY DESIGN STYLE:

Modern fintech SaaS

Clean white backgrounds

Soft gray surfaces

Elegant spacing

Rounded corners

Blue gradient identity

Minimal UI noise

Premium typography

Mobile-first layout

Smooth transitions

Fast interfaces

PRIMARY COLOR SYSTEM:
Main Gradient:

#0F172A

#1D4ED8

#2563EB

#38BDF8

Accent Colors:

Green = Paid / Valid

Orange = Warning

Red = Overdue / Invalid

TYPOGRAPHY:

Inter

SF Pro

Poppins

DESIGN INSPIRATION:

Stripe

Linear

Revolut Business

Notion

Brex

Wave Accounting

PLATFORM MODES:
Before entering the platform, users can choose:

[ Continue on Mobile ]
[ Continue on Web ]

IMPORTANT:
Both Mobile and Web versions MUST contain ALL features and workflows.

The mobile app must NOT be a limited experience.

Both platforms must:

Support invoice generation

PDF preview

AI assistant

WhatsApp automation

Reports

Collections

Chat

Multi-company switching

Offline mode

Payments

Notifications

Settings

Team management

MOBILE EXPERIENCE:
Design the mobile application as a premium native fintech experience.

MOBILE REQUIREMENTS:

Touch-first

Bottom navigation

Fast actions

Swipe interactions

Floating action buttons

Optimized for low digital literacy

Offline-first

Voice commands

PDF preview before download

WhatsApp sharing

AI assistant accessible everywhere

MOBILE MAIN NAVIGATION:

Dashboard

Invoices

Clients

Payments

Reports

AI Assistant

More

WEB EXPERIENCE:
Create a responsive professional dashboard experience with:

Sidebar navigation

Analytics

Reports

Team management

Multi-window workflows

Advanced filters

Large tables

Quick actions

MAIN SYSTEM FEATURES:

AUTHENTICATION & USER ACCOUNTS
Implement:

Login

Register

Forgot password

Email verification

Phone verification

2FA optional

Session management

Social login optional

ROLE-BASED ACCESS:

Owner

Manager

Accountant

OWNER:

Full access

Billing

Settings

AI

Reports

Team

Subscriptions

MANAGER:

Operational access

Sales

Clients

Payments

Products

Quotations

ACCOUNTANT:

Read-only financial access

Tax reports

SAF-T exports

Financial reports

Movements only

DATABASE CONNECTION (LOVABLE CLOUD)
Replace all demo/static data with real database structures.

DATABASE TABLES:

users

companies

clients

suppliers

invoices

invoice_items

quotations

quotation_items

receipts

products

payments

expenses

subscriptions

notifications

chats

messages

reports

roles

permissions

settings

document_verifications

BACKEND STACK:

Node.js

NestJS

PostgreSQL

Redis

Prisma ORM

REST API

WebSockets

SETTINGS & PROFILE PAGE
Create a complete SaaS settings module.

SECTIONS:

Company profile

Branding

Tax settings

NUIT settings

Team members

Roles & permissions

Billing plans

Subscription management

Notification preferences

WhatsApp integration

Email settings

PDF templates

Invoice numbering

AI settings

PUBLIC PRICING PAGE
Create a modern pricing page.

PLANS:

Starter

Business

Enterprise

FEATURES COMPARISON:

Number of users

Number of companies

WhatsApp automation

AI assistant

Reports

Storage

Quotation images

Offline mode

Premium templates

CTA:

Start Free Trial

Contact Sales

DASHBOARD EXPERIENCE
Create a premium clean dashboard.

WIDGETS:

Sales today

Monthly revenue

Pending payments

Outstanding invoices

Cash flow

Top customers

Recent activities

Collection alerts

QUICK ACTIONS:

Create invoice

Add customer

Receive payment

Create quotation

Send reminder

Add product

INVOICING SYSTEM
Create an ultra simplified invoicing experience.

SUPPORTED DOCUMENTS:

Invoice

Simplified Invoice

Receipt

Invoice-Receipt

Credit Note

Quotation

Proforma Invoice

Purchase Order

Delivery Note

Transport Guide

WORKFLOW:

Select customer

Add products

Automatic VAT

Preview PDF

Send via:

WhatsApp

Email

Both

PDF PREVIEW:
Users MUST preview the PDF before downloading or sending.

PDF VIEWER:

Zoom

Share

Download

Print

Send instantly

AI ASSISTANT
The AI assistant must simplify workflows.

SUPPORTED COMMANDS:
“Create invoice for João Comercial”
“Add new customer”
“Generate quotation”
“Show overdue payments”
“Create product cement 32.5”

VOICE COMMANDS:
Allow invoice generation by voice.

AI FEATURES:

Smart invoice generation

Product detection

Client detection

Automatic calculations

Draft preview

Smart recommendations

CLIENT MANAGEMENT
FEATURES:

Customer creation

NUIT validation

WhatsApp number

Email

Credit tracking

Purchase history

Notes

Payment behavior analytics

MULTI-COMPANY MANAGEMENT
After login:
Display company selector.

Example:

Quota Retail

Quota Logistics

Quota Construction

Single subscription can manage multiple companies.

WHATSAPP-FIRST EXPERIENCE
IMPORTANT:
WhatsApp is the primary communication channel.

FEATURES:

Send invoices via WhatsApp

Payment reminders

Collections

Payment confirmations

Shared quotations

Customer chat integration

CUSTOMER CHAT CENTER
Create centralized messaging.

FLOW:
Customer sends WhatsApp →
Message enters Quota →
Business replies inside Quota →
Customer receives response on WhatsApp

LIMITED AI CUSTOMER ASSISTANT
The AI chatbot ONLY answers:

Outstanding balance

Due date

Invoice status

Payment confirmation

DO NOT build a general AI chatbot.

AUTOMATED COLLECTIONS
Create smart collection automation.

FEATURES:

Scheduled reminders

Overdue alerts

Smart payment reminders

Recurring invoices

WhatsApp collections

Payment tracking

QUOTATION IMAGE ADD-ON
Create a premium quotation image feature.

PURPOSE:
Allow businesses to attach product images inside quotations.

USE CASES:

Construction

Furniture

Electronics

Decoration

Equipment sales

FEATURES:

Upload product image

Image optimization

Thumbnail display

Mobile preview

Multiple images optional

LAYOUT:

| Product | Image | Quantity | Price |

IMAGE RULES:

Lightweight

Fast loading

Optimized automatically

Modern thumbnail layout

STORAGE:

AWS S3 or Cloudflare R2

DOCUMENT VERIFICATION SYSTEM
Create a public document verification system similar to premium invoicing platforms.

PDF DOCUMENTS MUST INCLUDE:

Verification badge

Verification link

QR Code

Security hash

EXAMPLE:
“✓ Verified by Quota”

WHEN CLICKED:
Open:
verify.quota.co.mz/document/FT2026-00023

VERIFICATION PAGE MUST SHOW:

Document status

Company name

Issue date

Amount

Validation result

QR verification

Fiscal authenticity

VALID DOCUMENT:

Green success state

INVALID DOCUMENT:

Red warning state

ARCHITECTURE:
Invoice Generated
↓
Generate verification hash
↓
Generate QR Code
↓
Embed into PDF
↓
Public verification page

REPORTING SYSTEM
Create:

Monthly reports

Revenue analytics

Customer analytics

Debt tracking

Payment reports

Financial summaries

PDF exports

Excel exports

OFFLINE-FIRST EXPERIENCE
IMPORTANT FOR MOZAMBIQUE:
The system must continue working with unstable internet.

OFFLINE FEATURES:

Local caching

Sync later

Queue actions

Offline invoice generation

Offline customer access

PAYMENT INTEGRATIONS
Integrate:

M-Pesa

e-Mola

Bank transfer

Mobile money

Payment links

SYSTEM ARCHITECTURE
FRONTEND:

Next.js

React

TailwindCSS

TypeScript

MOBILE:

Flutter

BACKEND:

Node.js

NestJS

DATABASE:

PostgreSQL

CACHE:

Redis

STORAGE:

AWS S3

AUTH:

JWT

RBAC

SERVICES:

API Gateway

Billing Service

AI Service

Notification Service

Reporting Service

Chat Service

WhatsApp Service

Verification Service

DESIGN SYSTEM
Create reusable UI components:

Cards

Buttons

Tables

Charts

Modals

Inputs

Dropdowns

Sidebars

Mobile navigation

Empty states

Skeleton loaders

USER EXPERIENCE RULES
VERY IMPORTANT:

No ERP complexity

No accounting jargon

Fast workflows

Minimal clicks

Friendly labels

Mobile-first

Clear navigation

Premium feel

REQUIRED OUTPUTS
Generate:

Full SaaS system design

UX flows

Mobile screens

Web dashboard

Wireframes

Database schema

API architecture

Microservice architecture

Authentication flows

User journey maps

Pricing page

Settings page

Document verification pages

Quotation image workflows

WhatsApp flows

AI assistant flows

Offline synchronization flows

FINAL PRODUCT GOAL:
Quota must become:
“The simplest and smartest invoicing platform in Mozambique.”

The final experience must feel:

Premium

Intelligent

Clean

Fast

Human

Mobile-first

Fintech-grade

African-market optimized

Extremely easy to use

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e2578352-f526-4c6e-8910-b83fd049ae8e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
