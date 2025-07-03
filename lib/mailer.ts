// src/lib/mailer.ts
import nodemailer from 'nodemailer';

// Configura o "transportador" de e-mail usando as credenciais do seu Outlook/Hotmail
export const transporter = nodemailer.createTransport({
  host: "smtp.office365.com", // Servidor SMTP do Outlook
  port: 587, // Porta para TLS
  secure: false, // false para TLS na porta 587
  auth: {
    user: "viniciusschmalfuss@hotmail.com", // O seu e-mail do Outlook/Hotmail (ex: "meu.email@outlook.com")
    pass: "mpaacblvhsrpcvml", // A sua senha normal ou a senha de aplicativo gerada
  },
});