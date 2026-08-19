/**
 * Módulo de Impressão e Exportação para PDF
 * Implementa com exatidão as macros ExportarParaPDF e folhaPonto
 */

const PDFPrintManager = {
  /**
   * Dispara a impressão do navegador com o layout formatado para o elemento ativo
   */
  printCurrentView() {
    window.print();
  },

  /**
   * Gera e prepara o conteúdo para impressão em lote da Folha de Ponto
   * @param {Array<number>} employeeIds - Lista de IDs dos funcionários (ex: [5, 6, 7, 8, 9, 10])
   * @param {Object} company - Dados da empresa
   * @param {Array} employees - Lista completa de funcionários
   * @param {string} dateRef - Data base do ciclo (ex: '2026-06-21')
   */
  prepareBatchFolhaPontoPrint(employeeIds, company, employees, dateRef) {
    const printArea = document.getElementById('print-batch-container');
    if (!printArea) return;

    printArea.innerHTML = '';

    // Data de referência da folha: 1º dia do mês seguinte ao ciclo
    const refDateObj = new Date(dateRef);
    const targetMonthIndex = (refDateObj.getMonth() + 1) % 12;
    const targetYear = targetMonthIndex === 0 ? refDateObj.getFullYear() + 1 : refDateObj.getFullYear();

    const monthNames = [
      'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
      'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ];
    const refLabel = `${monthNames[targetMonthIndex].slice(0, 3)}-${targetYear}`;

    const daysOfMonth = CalculoPonto.gerarDatasFolhaPonto(targetYear, targetMonthIndex);
    const lastDayNum = daysOfMonth.length;
    const periodoLabel = `De: 01/${String(targetMonthIndex + 1).padStart(2, '0')}/${targetYear} a ${String(lastDayNum).padStart(2, '0')}/${String(targetMonthIndex + 1).padStart(2, '0')}/${targetYear}`;

    const validIds = employeeIds.filter(id => {
      const emp = employees.find(e => e.id === id);
      return emp && emp.nome && emp.nome.trim().length > 0;
    });

    if (validIds.length === 0) {
      alert('Nenhum funcionário cadastrado no intervalo selecionado.');
      return;
    }

    validIds.forEach((empId, idx) => {
      const emp = employees.find(e => e.id === empId);

      const pageDiv = document.createElement('div');
      pageDiv.className = 'folha-ponto-print-page';

      pageDiv.innerHTML = `
        <div class="folha-header">
          <div class="header-main-row">
            <div class="company-logo-text">
              <h2 class="title-doc">FOLHA DE PONTO</h2>
            </div>
            <div class="ref-badge">
              <span class="ref-label">Ref:</span>
              <span class="ref-val">${refLabel}</span>
            </div>
          </div>

          <div class="header-info-grid">
            <div class="info-cell full"><span class="lbl">Empresa:</span> <span class="val">${company.empresa || ''}</span></div>
            <div class="info-cell"><span class="lbl">CNPJ:</span> <span class="val">${company.cnpj || ''}</span></div>
            <div class="info-cell full"><span class="lbl">Endereço:</span> <span class="val">${company.endereco || ''}</span></div>
            <div class="info-cell"><span class="lbl">Funcionário:</span> <strong class="val">${emp.nome}</strong></div>
            <div class="info-cell"><span class="lbl">Matrícula:</span> <span class="val">${emp.matricula || '-'}</span></div>
            <div class="info-cell"><span class="lbl">Função:</span> <span class="val">${emp.funcao || ''}</span></div>
            <div class="info-cell"><span class="lbl">CTPS:</span> <span class="val">${emp.ctps || '-'}</span></div>
            <div class="info-cell"><span class="lbl">Período:</span> <span class="val">${periodoLabel}</span></div>
            <div class="info-cell"><span class="lbl">Escala:</span> <span class="val">${emp.escala || '6x1'}</span></div>
          </div>
        </div>

        <table class="folha-ponto-table">
          <thead>
            <tr>
              <th rowspan="2" class="col-data">Data</th>
              <th colspan="4" class="col-jornada">Jornada</th>
              <th rowspan="2" class="col-extra">Hs. Extras + Atrasos -</th>
              <th rowspan="2" class="col-ass">Assinatura do Funcionário</th>
            </tr>
            <tr>
              <th class="col-sub">Entrada</th>
              <th class="col-sub" colspan="2">Intervalo</th>
              <th class="col-sub">Saída</th>
            </tr>
          </thead>
          <tbody>
            ${daysOfMonth.map(d => `
              <tr>
                <td class="cell-date"><strong>${d.dayNumber}</strong> - ${d.dayOfWeek}</td>
                <td class="cell-time"></td>
                <td class="cell-time"></td>
                <td class="cell-time"></td>
                <td class="cell-time"></td>
                <td class="cell-extra"></td>
                <td class="cell-ass-line"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="folha-footer">
          <div class="obs-box">
            <div class="obs-title">OBSERVAÇÕES</div>
            <div class="obs-content"></div>
          </div>

          <div class="resumo-totais-folha">
            <div class="tot-box">
              <span>Horas Extras:</span>
              <div class="tot-line"></div>
            </div>
            <div class="tot-box">
              <span>Faltas/Atrasos:</span>
              <div class="tot-line"></div>
            </div>
          </div>

          <div class="signatures-row">
            <div class="sign-block">
              <div class="sign-line"></div>
              <span>Funcionário</span>
            </div>
            <div class="sign-block">
              <div class="sign-line"></div>
              <span>Empresa</span>
            </div>
          </div>
        </div>
      `;

      printArea.appendChild(pageDiv);
    });

    // Ativa o modo de impressão em lote ocultando tudo o mais
    document.body.classList.add('printing-batch');

    const cleanUp = () => {
      document.body.classList.remove('printing-batch');
      window.removeEventListener('afterprint', cleanUp);
    };
    window.addEventListener('afterprint', cleanUp);

    setTimeout(() => {
      window.print();
      // Fallback para caso afterprint não seja disparado
      setTimeout(cleanUp, 1500);
    }, 200);
  },

  /**
   * Exporta a visualização atual para PDF usando html2pdf.js ou impressão direta
   */
  exportToPDF(filename = 'documento.pdf', elementId = 'app-main-content') {
    const elem = document.getElementById(elementId);
    if (!elem) {
      window.print();
      return;
    }

    if (window.html2pdf) {
      const opt = {
        margin: [5, 5, 5, 5],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: filename.includes('resumo') ? 'landscape' : 'portrait' }
      };
      window.html2pdf().set(opt).from(elem).save();
    } else {
      window.print();
    }
  }
};
