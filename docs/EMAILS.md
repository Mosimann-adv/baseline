# E-mails do Baseline no Supabase — modelos prontos para colar

Onde colar: painel do Supabase → projeto `szpmzcrxyisehrvwlene` → **Authentication → Email Templates** → abra cada modelo, cole o **assunto** e o **conteúdo**, salve.

Regra de ouro: **não apague as variáveis entre chaves** (`{{ .ConfirmationURL }}`, `{{ .Token }}`). Sem elas, o botão e o código não funcionam.

O logo vem do endereço público do app. As cores são as do kit do Instituto (Maré `#133358`, Oceano `#015CA6`, Coral `#D96953`, creme `#F8F1E0`).

---

## 1. Confirm signup (confirmação de conta nova)

**Subject:**

```
Confirme seu e-mail no Baseline
```

**Content (colar como está):**

```html
<div style="margin:0;padding:24px 16px;background-color:#F8F1E0;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;">
    <div style="background-color:#133358;padding:24px;text-align:center;">
      <img src="https://baseline-six-sigma.vercel.app/icons/icon-192.png" alt="Baseline" width="64" height="64" style="border-radius:16px;" />
      <p style="margin:12px 0 0;color:#F8F1E0;font-size:20px;font-weight:bold;">Baseline by Arvoredo</p>
    </div>
    <div style="padding:24px;">
      <h1 style="margin:0 0 12px;font-size:22px;color:#133358;">Quase lá!</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#333333;">Olá! Você criou uma conta no <strong>Baseline</strong>, o app de treinos de basquete do Instituto Arvoredo.</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#333333;">Toque no botão para confirmar seu e-mail e começar a treinar:</p>
      <p style="margin:0 0 20px;text-align:center;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;background-color:#D96953;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;border-radius:999px;">Confirmar meu e-mail</a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#777777;">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
      <p style="margin:0;font-size:13px;line-height:1.5;color:#777777;word-break:break-all;">{{ .ConfirmationURL }}</p>
    </div>
    <div style="padding:16px 24px;background-color:#F8F1E0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#777777;">Baseline by Arvoredo · Instituto Arvoredo (CNPJ 56.660.275/0001-06)</p>
    </div>
  </div>
</div>
```

---

## 2. Magic link (código de “esqueci a senha”)

É este modelo que o app usa na recuperação de senha: a pessoa recebe um **código** e digita no app.

**Subject:**

```
Seu código do Baseline: {{ .Token }}
```

**Content (colar como está):**

```html
<div style="margin:0;padding:24px 16px;background-color:#F8F1E0;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;">
    <div style="background-color:#133358;padding:24px;text-align:center;">
      <img src="https://baseline-six-sigma.vercel.app/icons/icon-192.png" alt="Baseline" width="64" height="64" style="border-radius:16px;" />
      <p style="margin:12px 0 0;color:#F8F1E0;font-size:20px;font-weight:bold;">Baseline by Arvoredo</p>
    </div>
    <div style="padding:24px;">
      <h1 style="margin:0 0 12px;font-size:22px;color:#133358;">Aqui está seu código</h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#333333;">Você pediu para trocar a senha no <strong>Baseline</strong>. Digite este código no app:</p>
      <p style="margin:0 0 20px;text-align:center;font-size:36px;font-weight:bold;letter-spacing:8px;color:#133358;">{{ .Token }}</p>
      <p style="margin:0;font-size:13px;line-height:1.5;color:#777777;">O código expira em pouco tempo. Se não funcionar, peça outro no app. Não foi você? Ignore este e-mail.</p>
    </div>
    <div style="padding:16px 24px;background-color:#F8F1E0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#777777;">Baseline by Arvoredo · Instituto Arvoredo (CNPJ 56.660.275/0001-06)</p>
    </div>
  </div>
</div>
```

---

## Como confirmar que funcionou

1. Com um e-mail **fora da equipe do projeto**, crie uma conta nova no site real → a confirmação tem que chegar com a cara acima.
2. Na tela de entrar, use “esqueci a senha” com esse e-mail → o código tem que chegar com o assunto mostrando o número.
3. Acompanhe entregas e erros no painel da Brevo (Logs).

Se o botão de confirmação levar para o lugar errado, o problema é a **URL Configuration** no Supabase (Site URL `https://baseline-six-sigma.vercel.app`), não o modelo.
