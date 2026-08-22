# Auth

O login do motorista está implementado diretamente na Driver PWA com Supabase Auth. Este módulo da API continua reservado para validação de JWT via JWKS e autorização por `UserRole` nas operações críticas.

Enquanto este módulo não for implementado, a API não deve considerar o estado do cliente como autorização de servidor. `SUPABASE_JWKS_URL` ainda não é consumida pelo código atual.
