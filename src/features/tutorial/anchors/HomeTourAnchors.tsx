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
  if (!el) return false;
  // procura um contêiner "razoável" para receber o atributo (evita colocar direto no <h1>)
  let target: HTMLElement | null = el as HTMLElement;
  // se é um heading, tenta subir/achar um wrapper pai que tenha conteúdo relacionado
  if (/^H[1-6]$/.test(target.tagName) && target.parentElement) {
    target = target.parentElement;
  }
  if (!target || target.getAttribute("data-tour") === value) return !!target;
  target.setAttribute("data-tour", value);
  return true;
}

export default function HomeTourAnchors() {
  useEffect(() => {
    const anchors = [
      {
        id: "home:fazendas",
        applied: false,
        apply: () => {
          const farmsTitle = byText(document.body, "suas fazendas");
          if (!farmsTitle) return false;

          let container: HTMLElement | null = farmsTitle.parentElement as HTMLElement | null;
          if (container && !container.querySelector("div,section,ul")) {
            container = container.parentElement as HTMLElement | null;
          }

          return setAnchor(container ?? farmsTitle, "home:fazendas");
        }
      },
      {
        id: "home:criar",
        applied: false,
        apply: () => {
          const allButtons = Array.from(document.querySelectorAll("button, a")) as HTMLElement[];
          const createBtn = allButtons.find((el) => (el.textContent || "").toLowerCase().includes("criar fazenda"));
          if (!createBtn) return false;
          if (createBtn.getAttribute("data-tour") === "home:criar") return true;
          createBtn.setAttribute("data-tour", "home:criar");
          return true;
        }
      },
      {
        id: "home:resumo",
        applied: false,
        apply: () => {
          const resumoTitle = byText(document.body, "resumo da conta");
          if (!resumoTitle) return false;

          let resumoContainer: HTMLElement | null = resumoTitle.parentElement as HTMLElement | null;
          if (resumoContainer && !resumoContainer.querySelector("div,section,ul")) {
            resumoContainer = resumoContainer.parentElement as HTMLElement | null;
          }

          return setAnchor(resumoContainer ?? resumoTitle, "home:resumo");
        }
      }
    ];

    const applyAnchors = () => {
      let allApplied = true;
      for (const anchor of anchors) {
        if (anchor.applied) continue;
        const success = anchor.apply();
        if (success) {
          anchor.applied = true;
        } else {
          allApplied = false;
        }
      }
      return allApplied;
    };

    if (applyAnchors()) {
      return;
    }

    const observer = new MutationObserver(() => {
      if (applyAnchors()) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
