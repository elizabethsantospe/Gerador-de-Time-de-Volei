// App para gerenciar jogadoras e montar times de vôlei
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import jsPDF from "jspdf";
import "jspdf-autotable";

const POSICOES = ["Levantadora", "Oposto", "Central", "Ponteira"];

export default function VoleiApp() {
  const [jogadoras, setJogadoras] = useState([]);
  const [nome, setNome] = useState("");
  const [posicao, setPosicao] = useState("Levantadora");
  const [presentes, setPresentes] = useState([]);
  const [ordem, setOrdem] = useState([]);
  const [times, setTimes] = useState([]);

  const adicionarJogadora = () => {
    const nova = {
      id: Date.now(),
      nome,
      posicao,
      jogos: 0,
    };
    setJogadoras([...jogadoras, nova]);
    setNome("");
    setPosicao("Levantadora");
  };

  const marcarPresenca = (id) => {
    if (!presentes.includes(id)) {
      setPresentes([...presentes, id]);
      setOrdem([...ordem, id]);
    } else {
      setPresentes(presentes.filter((pid) => pid !== id));
      setOrdem(ordem.filter((oid) => oid !== id));
    }
  };

  const gerarTimes = () => {
    const disponiveis = ordem
      .map((id) => jogadoras.find((j) => j.id === id && presentes.includes(id)))
      .filter(Boolean);

    const ordenadas = [...disponiveis].sort((a, b) => {
      if (a.jogos !== b.jogos) return a.jogos - b.jogos;
      return ordem.indexOf(a.id) - ordem.indexOf(b.id);
    });

    const selecionarPorPosicao = (lista, posicao, quantidade) => {
      return lista.filter((j) => j.posicao === posicao).slice(0, quantidade);
    };

    const time1 = [];
    const time2 = [];

    const montarTime = (candidatas) => {
      return [
        ...selecionarPorPosicao(candidatas, "Levantadora", 1),
        ...selecionarPorPosicao(candidatas, "Ponteira", 2),
        ...selecionarPorPosicao(candidatas, "Central", 2),
        ...selecionarPorPosicao(candidatas, "Oposto", 1),
      ];
    };

    time1.push(...montarTime(ordenadas));
    const idsTime1 = time1.map((j) => j.id);
    const restantes = ordenadas.filter((j) => !idsTime1.includes(j.id));

    time2.push(...montarTime(restantes));

    const atualizarJogos = (time) => {
      time.forEach((j) => {
        const index = jogadoras.findIndex((x) => x.id === j.id);
        jogadoras[index].jogos += 1;
      });
    };

    atualizarJogos([...time1, ...time2]);
    setJogadoras([...jogadoras]);
    setTimes([time1, time2]);
  };

  const gerarPDFEstatisticas = async () => {
    const doc = new jsPDF();
    const dataAtual = new Date().toLocaleDateString();

    const carregarImagem = async (url) => {
      const response = await fetch(url);
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    };

    const logoURL = "/mnt/data/logo santo volei.jpg"; // imagem local
    const logoBase64 = await carregarImagem(logoURL);
    doc.addImage(logoBase64, "JPEG", 80, 10, 50, 30);

    doc.setFontSize(18);
    doc.text("Relatório de Participação das Jogadoras", 20, 50);
    doc.setFontSize(12);
    doc.text(`Data: ${dataAtual}`, 20, 60);

    const sorted = [...jogadoras].sort((a, b) => a.nome.localeCompare(b.nome));
    const rows = sorted.map((j, index) => [index + 1, j.nome, j.posicao, j.jogos]);

    doc.autoTable({
      head: [["#", "Nome", "Posição", "Jogos"]],
      body: rows,
      startY: 70,
      styles: { fontSize: 11 },
    });

    doc.save("estatisticas_participacao.pdf");
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Gerador de Times de Vôlei</h1>

      <div className="flex flex-wrap gap-2 items-end">
        <input
          placeholder="Nome da jogadora"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={posicao}
          onChange={(e) => setPosicao(e.target.value)}
          className="border p-2 rounded"
        >
          {POSICOES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <Button onClick={adicionarJogadora}>Adicionar</Button>
      </div>

      <div>
        <h2 className="font-semibold">Jogadoras</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {jogadoras.map((j) => (
            <label key={j.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={presentes.includes(j.id)}
                onChange={() => marcarPresenca(j.id)}
              />
              <span>
                {j.nome} ({j.posicao}) - Jogos: {j.jogos}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Button onClick={gerarTimes}>Gerar Times</Button>
        <Button onClick={gerarPDFEstatisticas}>Finalizar e Gerar PDF</Button>
      </div>

      {times.length > 0 && (
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {times.map((time, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <h3 className="font-bold mb-2">Time {i + 1}</h3>
                  {time.map((j) => (
                    <div key={j.id}>
                      {j.nome} - {j.posicao} (Jogos: {j.jogos})
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6">
            <h2 className="font-semibold text-lg">Estatísticas de Participação</h2>
            <ul className="list-disc list-inside">
              {[...jogadoras]
                .sort((a, b) => a.nome.localeCompare(b.nome))
                .map((j) => (
                  <li key={j.id}>
                    {j.nome} - Jogos: {j.jogos}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
