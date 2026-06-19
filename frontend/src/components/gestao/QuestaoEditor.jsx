import { useState } from "react";

const TIPOS = [
  { value: "multipla_escolha", label: "Múltipla escolha" },
  { value: "verdadeiro_falso", label: "Verdadeiro ou falso" },
];

export default function QuestaoEditor({ questao, onSave, onDelete }) {
  const [enunciado, setEnunciado] = useState(questao?.enunciado || "");
  const [tipo, setTipo] = useState(questao?.tipo || "multipla_escolha");
  const [opcoes, setOpcoes] = useState(questao?.opcoes?.length ? questao.opcoes : ["", ""]);
  const [correta, setCorreta] = useState(
    questao?.resposta_correta?.valor ?? questao?.resposta_correta ?? 0
  );

  const handleSave = () => {
    const payload = {
      enunciado,
      tipo,
      opcoes: tipo === "verdadeiro_falso" ? ["Verdadeiro", "Falso"] : opcoes.filter(Boolean),
      resposta_correta: { valor: tipo === "verdadeiro_falso" ? correta : Number(correta) },
    };
    onSave(payload);
  };

  return (
    <div className="gestao-questao">
      <label>
        Enunciado
        <textarea value={enunciado} onChange={(e) => setEnunciado(e.target.value)} rows={2} />
      </label>
      <label>
        Tipo
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>

      {tipo === "multipla_escolha" && (
        <div className="gestao-opcoes">
          <span>Opções (marque a correta)</span>
          {opcoes.map((op, i) => (
            <div key={i} className="gestao-opcao-row">
              <input
                type="radio"
                name={`correta-${questao?.id || "nova"}`}
                checked={Number(correta) === i}
                onChange={() => setCorreta(i)}
              />
              <input
                value={op}
                onChange={(e) => {
                  const n = [...opcoes];
                  n[i] = e.target.value;
                  setOpcoes(n);
                }}
                placeholder={`Opção ${i + 1}`}
              />
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpcoes([...opcoes, ""])}>
            + Opção
          </button>
        </div>
      )}

      {tipo === "verdadeiro_falso" && (
        <label>
          Resposta correta
          <select value={correta} onChange={(e) => setCorreta(e.target.value)}>
            <option value="Verdadeiro">Verdadeiro</option>
            <option value="Falso">Falso</option>
          </select>
        </label>
      )}

      <div className="gestao-questao-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
          {questao?.id ? "Atualizar" : "Adicionar questão"}
        </button>
        {questao?.id && onDelete && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onDelete(questao.id)}>
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}
