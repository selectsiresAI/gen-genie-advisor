"use client";
import { useEffect } from "react";

/**
 * Helpers robustos para localizar elementos por texto/heurística
 */
function byText(root: ParentNode, text: string) {
  const walker = document.createTreeWalker(root as Node, NodeFilter.SHOW_ELEMENT);
  let n: Node | null = walker.nextNode();
  const t = text.toLowerCase();
  while (n) {
    const el = n as HTMLElement;
    const txt = el.textContent?.toLowerCase() ?? "";
    if (txt.includes(t)) return el;
    n = walker.nextNode();
  }
  return null;
}

function setAnchor(el: Element | null, value: string) {
  if (!el) return;
  // procura um contêiner "razoável" para receber o atributo (evita colocar direto no <h1>)
  let target: HTMLElement | null = el as HTMLElement;
  // se é um heading, tenta subir/achar um wrapper pai que tenha conteúdo relacionado
  if (/^H[1-6]$/.test(target.tagName) && target.parentElement) {
    target = target.parentElement;
  }
  target?.setAttribute("data-tour", value);
}

export default function HomeTourAnchors() {
  useEffect(() => {
    // 1) "Suas Fazendas" – usa heading/área que contém essa string
    const farmsTitle = byText(document.body, "suas fazendas");
    if (farmsTitle) {
      // procura um container próximo (pai ou next section)
      let container: HTMLElement | null = farmsTitle.parentElement as HTMLElement | null;
      // tenta a seção seguinte, se fizer sentido
      if (container && !container.querySelector("div,section,ul")) {
        container = container.parentElement as HTMLElement | null;
      }
      setAnchor(container ?? farmsTitle, "home:fazendas");
    }

    // 2) Botão "+ Criar Fazenda" – busca por botão com esse texto
    const allButtons = Array.from(document.querySelectorAll("button, a")) as HTMLElement[];
    const createBtn = allButtons.find((el) => (el.textContent || "").toLowerCase().includes("criar fazenda"));
    if (createBtn) {
      createBtn.setAttribute("data-tour", "home:criar");
    }

    // 3) "Resumo da Conta" – idem ao título e seu contêiner
    const resumoTitle = byText(document.body, "resumo da conta");
    if (resumoTitle) {
      let resumoContainer: HTMLElement | null = resumoTitle.parentElement as HTMLElement | null;
      if (resumoContainer && !resumoContainer.querySelector("div,section,ul")) {
        resumoContainer = resumoContainer.parentElement as HTMLElement | null;
      }
      setAnchor(resumoContainer ?? resumoTitle, "home:resumo");
    }
  }, []);

  return null;
}
