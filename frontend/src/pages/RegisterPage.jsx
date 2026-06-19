import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/api";
import { formatarCpf } from "../utils/cpf";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCpfChange = (e) => {
    setCpf(formatarCpf(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await register(nome, email, cpf, password);
      navigate("/login", {
        state: { message: "Conta criada! Faça login para continuar." },
      });
    } catch (err) {
      setErro(err.message || "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Criar conta</h2>
      <p className="auth-subtitle">Cadastre-se na UniversidadeMoney</p>

      {erro && <div className="alert alert-error">{erro}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Nome completo
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            autoComplete="name"
            placeholder="Seu nome"
          />
        </label>
        <label>
          CPF
          <input
            type="text"
            value={cpf}
            onChange={handleCpfChange}
            required
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            maxLength={14}
          />
        </label>
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="seu@email.com"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Cadastrando..." : "Criar conta"}
        </button>
      </form>

      <p className="auth-footer">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </>
  );
}
