/**
 * Controlador Principal da Aplicação
 * Gerencia a navegação, renderização, eventos e interação do usuário
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado da Aplicação
  const state = {
    currentView: 'view-home',
    activeEmployeeId: 1,
    company: StorageManager.getCompany(),
    employees: StorageManager.getEmployees(),
    cycleDates: []
  };

  // Inicialização
  init();

  function init() {
    state.cycleDates = CalculoPonto.gerarDatasCiclo(state.company.inicioCiclo);
    populateSelectOptions();
    bindGlobalEvents();
    renderHeaderInfo();
    renderEmployeesGrid();
    renderTimecard();
    renderResumoHoras();
    renderFolhaPontoSingle();
  }

  // Preenche opções estáticas de selects
  function populateSelectOptions() {
    const admFuncaoSelect = document.getElementById('adm-funcao');
    const editEmpFuncaoSelect = document.getElementById('edit-emp-funcao');
    const admInstrucaoSelect = document.getElementById('adm-instrucao');

    if (admFuncaoSelect) {
      admFuncaoSelect.innerHTML = FUNCOES_DISPONIVEIS.map(f => `<option value="${f}">${f}</option>`).join('');
    }
    if (editEmpFuncaoSelect) {
      editEmpFuncaoSelect.innerHTML = FUNCOES_DISPONIVEIS.map(f => `<option value="${f}">${f}</option>`).join('');
    }
    if (admInstrucaoSelect) {
      admInstrucaoSelect.innerHTML = GRAUS_INSTRUCAO.map(g => `<option value="${g}">${g}</option>`).join('');
    }

    // Formulário da empresa
    document.getElementById('inp-home-empresa').value = state.company.empresa || '';
    document.getElementById('inp-home-cnpj').value = state.company.cnpj || '';
    document.getElementById('inp-home-endereco').value = state.company.endereco || '';
    document.getElementById('inp-home-iniciociclo').value = state.company.inicioCiclo || '2026-06-21';
  }

  // Atualiza cabeçalho geral
  function renderHeaderInfo() {
    const firstDate = state.cycleDates[0] ? state.cycleDates[0].label.split(' - ')[0] + '/' + state.cycleDates[0].year : '';
    const lastDate = state.cycleDates[30] ? state.cycleDates[30].label.split(' - ')[0] + '/' + state.cycleDates[30].year : '';
    const cycleStr = `Ciclo: ${firstDate} a ${lastDate}`;

    document.getElementById('hdr-empresa-name').textContent = state.company.empresa || 'Empresa';
    document.getElementById('hdr-cycle-info').textContent = cycleStr;
    document.getElementById('adm-empresa-subhead').textContent = `${state.company.empresa} | CNPJ: ${state.company.cnpj}`;

    document.getElementById('resumo-empresa-lbl').textContent = state.company.empresa;
    document.getElementById('resumo-cnpj-lbl').textContent = state.company.cnpj;
    document.getElementById('resumo-periodo-lbl').textContent = `De: ${firstDate} a ${lastDate}`;
  }

  // ==========================================================================
  // NAVEGAÇÃO ENTRE ABAS / TELAS
  // ==========================================================================

  function switchView(targetViewId) {
    state.currentView = targetViewId;
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));

    const targetSection = document.getElementById(targetViewId);
    if (targetSection) targetSection.classList.add('active');

    const matchingTab = document.querySelector(`.nav-tab[data-target="${targetViewId}"]`);
    if (matchingTab) matchingTab.classList.add('active');

    // Ações de refresh específicas ao mudar de aba
    if (targetViewId === 'view-resumo') {
      renderResumoHoras();
    } else if (targetViewId === 'view-cartao') {
      renderTimecard();
    } else if (targetViewId === 'view-folha') {
      renderFolhaPontoSingle();
    } else if (targetViewId === 'view-home') {
      renderEmployeesGrid();
    }
  }

  // ==========================================================================
  // TELA 1: LISTA / GRADE DE FUNCIONÁRIOS (HOME)
  // ==========================================================================

  function renderEmployeesGrid() {
    const grid = document.getElementById('employees-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const activeCount = state.employees.filter(e => e.nome && e.nome.trim()).length;
    document.getElementById('count-employees').textContent = activeCount;

    state.employees.forEach((emp, index) => {
      const isFilled = emp.nome && emp.nome.trim().length > 0;
      const card = document.createElement('div');
      card.className = `employee-card ${isFilled ? '' : 'empty-slot'}`;

      if (isFilled) {
        card.innerHTML = `
          <div>
            <span class="emp-badge-id">#${emp.id}</span>
            <h3 class="emp-name">${emp.nome}</h3>
            <p class="emp-role">${emp.funcao || 'Função não definida'}</p>
            <div class="emp-meta">
              <span class="meta-pill">Escala: <strong>${emp.escala || '6x1'}</strong></span>
              <span class="meta-pill">CTPS: <strong>${emp.ctps || 'N/A'}</strong></span>
              ${emp.matricula ? `<span class="meta-pill">Matr.: <strong>${emp.matricula}</strong></span>` : ''}
            </div>
          </div>
          <div class="emp-actions">
            <button class="btn btn-primary btn-sm btn-open-timecard" data-id="${emp.id}">📅 Cartão de Ponto</button>
            <button class="btn btn-secondary btn-sm btn-edit-emp" data-id="${emp.id}">✏️ Editar</button>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div>
            <span class="emp-badge-id">#${emp.id}</span>
            <h3 class="emp-name" style="color: var(--text-muted); font-style: italic;">Slot Disponível (${emp.id})</h3>
            <p class="emp-role">Nenhum funcionário cadastrado</p>
          </div>
          <div class="emp-actions">
            <button class="btn btn-secondary btn-sm btn-edit-emp" data-id="${emp.id}">➕ Preencher Slot</button>
          </div>
        `;
      }
      grid.appendChild(card);
    });

    // Eventos dos botões nos cards
    grid.querySelectorAll('.btn-open-timecard').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        state.activeEmployeeId = id;
        switchView('view-cartao');
      });
    });

    grid.querySelectorAll('.btn-edit-emp').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        openEmployeeEditModal(id);
      });
    });
  }

  // ==========================================================================
  // TELA 2: CARTÃO DE PONTO INDIVIDUAL (f1..f22)
  // ==========================================================================

  function renderTimecard() {
    const select = document.getElementById('select-active-employee');
    select.innerHTML = state.employees.map(e => {
      const label = e.nome ? `${e.id}. ${e.nome} (${e.funcao || 'Geral'})` : `${e.id}. [Slot Vazio]`;
      return `<option value="${e.id}" ${e.id === state.activeEmployeeId ? 'selected' : ''}>${label}</option>`;
    }).join('');

    const emp = state.employees.find(e => e.id === state.activeEmployeeId) || state.employees[0];
    const daysData = StorageManager.getTimecard(emp.id);
    const computed = CalculoPonto.calcularTotaisMes(daysData, emp.escala || '6x1');

    // Atualiza barra de estatísticas
    const cargaMin = CalculoPonto.getCargaHorariaMinutes(emp.escala || '6x1');
    document.getElementById('stat-carga-horaria').textContent = `${emp.escala || '6x1'} (${CalculoPonto.formatMinutesToTime(cargaMin)})`;
    document.getElementById('stat-total-trabalhado').textContent = computed.totais.totalTrabalhado || '00:00';
    document.getElementById('stat-hs50').textContent = computed.totais.hs50 || '00:00';
    document.getElementById('stat-hs100').textContent = computed.totais.hs100 || '00:00';
    document.getElementById('stat-adnot').textContent = computed.totais.adNoturno || '00:00';
    document.getElementById('stat-faltas').textContent = computed.totais.faltas || '00:00';

    // Renderiza 31 linhas da tabela
    const tbody = document.getElementById('tbody-timecard-days');
    tbody.innerHTML = '';

    computed.days.forEach((day, index) => {
      const dateInfo = state.cycleDates[index] || { label: `Dia ${index+1}`, dayOfWeek: '' };
      const isWeekend = dateInfo.dayOfWeek === 'dom' || dateInfo.dayOfWeek === 'sáb';

      const tr = document.createElement('tr');
      if (isWeekend) tr.className = 'weekend-row';

      tr.innerHTML = `
        <td style="font-weight:600;">${dateInfo.label}</td>
        <td>
          <select class="event-select" data-row="${index}">
            ${EVENTOS_DISPONIVEIS.map(ev => `
              <option value="${ev.id}" ${day.evento === ev.id ? 'selected' : ''}>${ev.label}</option>
            `).join('')}
          </select>
        </td>
        <td><input type="text" class="time-input" data-field="entrada" data-row="${index}" value="${day.entrada || ''}" placeholder="--:--" maxlength="5"></td>
        <td><input type="text" class="time-input" data-field="intervaloSaida" data-row="${index}" value="${day.intervaloSaida || ''}" placeholder="--:--" maxlength="5"></td>
        <td><input type="text" class="time-input" data-field="intervaloRetorno" data-row="${index}" value="${day.intervaloRetorno || ''}" placeholder="--:--" maxlength="5"></td>
        <td><input type="text" class="time-input" data-field="saida" data-row="${index}" value="${day.saida || ''}" placeholder="--:--" maxlength="5"></td>
        <td class="cell-calc">${day.totalTrabalhado || ''}</td>
        <td class="cell-calc ${day.diferencaMins > 0 ? 'highlight-pos' : (day.diferencaMins < 0 ? 'highlight-neg' : '')}">${day.diferenca || ''}</td>
        <td class="cell-calc highlight-night">${day.adNoturno || ''}</td>
        <td class="cell-calc">${day.feriado || ''}</td>
        <td class="cell-calc highlight-pos">${day.hs50 || ''}</td>
        <td class="cell-calc highlight-pos" style="color:var(--color-warning);">${day.hs100 || ''}</td>
        <td class="cell-calc">${day.dom || ''}</td>
        <td class="cell-calc highlight-neg">${day.faltas || ''}</td>
      `;
      tbody.appendChild(tr);
    });

    // Atualiza linha de totais
    document.getElementById('tot-col-total').textContent = computed.totais.totalTrabalhado || '00:00';
    document.getElementById('tot-col-adnot').textContent = computed.totais.adNoturno || '00:00';
    document.getElementById('tot-col-feriado').textContent = computed.totais.feriado || '00:00';
    document.getElementById('tot-col-hs50').textContent = computed.totais.hs50 || '00:00';
    document.getElementById('tot-col-hs100').textContent = computed.totais.hs100 || '00:00';
    document.getElementById('tot-col-dom').textContent = computed.totais.dom || '00:00';
    document.getElementById('tot-col-faltas').textContent = computed.totais.faltas || '00:00';

    // Associa eventos de digitação e auto-formatação
    bindTimecardInputEvents();
  }

  function bindTimecardInputEvents() {
    const inputs = document.querySelectorAll('.timecard-table input.time-input');
    inputs.forEach(input => {
      input.addEventListener('input', (e) => {
        // Auto-formata enquanto digita (ex: '0800' -> '08:00')
        let val = e.target.value.replace(/\D/g, '');
        if (val.length >= 3) {
          val = val.slice(0, 2) + ':' + val.slice(2, 4);
        }
        e.target.value = val;
      });

      input.addEventListener('change', (e) => {
        const rowIdx = parseInt(e.target.getAttribute('data-row'), 10);
        const field = e.target.getAttribute('data-field');
        const days = StorageManager.getTimecard(state.activeEmployeeId);
        days[rowIdx][field] = e.target.value.trim();
        StorageManager.saveTimecard(state.activeEmployeeId, days);
        renderTimecard();
      });

      // Navegação por teclado (Enter pula para a próxima coluna/linha)
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const all = Array.from(inputs);
          const nextIdx = all.indexOf(e.target) + 1;
          if (nextIdx < all.length) all[nextIdx].focus();
        }
      });
    });

    document.querySelectorAll('.timecard-table select.event-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const rowIdx = parseInt(e.target.getAttribute('data-row'), 10);
        const days = StorageManager.getTimecard(state.activeEmployeeId);
        days[rowIdx].evento = e.target.value;
        StorageManager.saveTimecard(state.activeEmployeeId, days);
        renderTimecard();
      });
    });
  }

  // ==========================================================================
  // TELA 3: RESUMO DE HORAS (resumoHoras)
  // ==========================================================================

  function renderResumoHoras() {
    const tbody = document.getElementById('tbody-resumo-horas');
    if (!tbody) return;

    tbody.innerHTML = '';

    let sumAdNot = 0;
    let sumFeriado = 0;
    let sumHs50 = 0;
    let sumHs100 = 0;
    let sumDom = 0;
    let sumFaltas = 0;

    state.employees.forEach(emp => {
      const days = StorageManager.getTimecard(emp.id);
      const computed = CalculoPonto.calcularTotaisMes(days, emp.escala || '6x1');
      const tot = computed.totais;

      if (tot.adNoturnoMins) sumAdNot += tot.adNoturnoMins;
      if (tot.feriadoMins) sumFeriado += tot.feriadoMins;
      if (tot.hs50Mins) sumHs50 += tot.hs50Mins;
      if (tot.hs100Mins) sumHs100 += tot.hs100Mins;
      if (tot.domMins) sumDom += tot.domMins;
      if (tot.faltasMins) sumFaltas += tot.faltasMins;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 700; color: var(--text-muted);">${emp.id}</td>
        <td>
          <strong style="color: var(--color-primary); cursor: pointer;" class="btn-resumo-goto-emp" data-id="${emp.id}">
            ${emp.nome || `[Slot ${emp.id} - Vazio]`}
          </strong>
          ${emp.funcao ? `<span style="font-size:0.75rem; color:var(--text-muted); display:block;">${emp.funcao}</span>` : ''}
        </td>
        <td class="num-col" style="color: #7c3aed;">${tot.adNoturno !== '00:00' ? tot.adNoturno : ''}</td>
        <td class="num-col">${tot.feriado !== '00:00' ? tot.feriado : ''}</td>
        <td class="num-col" style="color: var(--color-success);">${tot.hs50 !== '00:00' ? tot.hs50 : ''}</td>
        <td class="num-col" style="color: var(--color-warning);">${tot.hs100 !== '00:00' ? tot.hs100 : ''}</td>
        <td class="num-col">${tot.dom !== '00:00' ? tot.dom : ''}</td>
        <td class="num-col" style="color: var(--color-danger);">${tot.faltas !== '00:00' ? tot.faltas : ''}</td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById('sum-adnot').textContent = CalculoPonto.formatMinutesToTime(sumAdNot);
    document.getElementById('sum-feriado').textContent = CalculoPonto.formatMinutesToTime(sumFeriado);
    document.getElementById('sum-hs50').textContent = CalculoPonto.formatMinutesToTime(sumHs50);
    document.getElementById('sum-hs100').textContent = CalculoPonto.formatMinutesToTime(sumHs100);
    document.getElementById('sum-dom').textContent = CalculoPonto.formatMinutesToTime(sumDom);
    document.getElementById('sum-faltas').textContent = CalculoPonto.formatMinutesToTime(sumFaltas);

    // Clique no nome para ir direto ao cartão
    tbody.querySelectorAll('.btn-resumo-goto-emp').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        state.activeEmployeeId = id;
        switchView('view-cartao');
      });
    });
  }

  // ==========================================================================
  // TELA 5: FOLHA DE PONTO INDIVIDUAL (folhaPonto)
  // ==========================================================================

  function renderFolhaPontoSingle() {
    const container = document.getElementById('folha-preview-single');
    if (!container) return;

    const emp = state.employees.find(e => e.id === state.activeEmployeeId) || state.employees[0];
    const refDateObj = new Date(state.company.inicioCiclo);
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

    container.innerHTML = `
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
          <div class="info-cell full"><span class="lbl">Empresa:</span> <span class="val">${state.company.empresa || ''}</span></div>
          <div class="info-cell"><span class="lbl">CNPJ:</span> <span class="val">${state.company.cnpj || ''}</span></div>
          <div class="info-cell full"><span class="lbl">Endereço:</span> <span class="val">${state.company.endereco || ''}</span></div>
          <div class="info-cell"><span class="lbl">Funcionário:</span> <strong class="val">${emp.nome || '[Não Selecionado]'}</strong></div>
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
            <span>Horas Extras</span>
            <div class="tot-line"></div>
          </div>
          <div class="tot-box">
            <span>Faltas/Atrasos</span>
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
  }

  // ==========================================================================
  // EVENTOS GLOBAIS E DIÁLOGOS
  // ==========================================================================

  function bindGlobalEvents() {
    // Navegação de abas
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-target');
        switchView(target);
      });
    });

    // Atalhos do Home
    document.getElementById('btn-quick-folha-ponto').addEventListener('click', () => {
      openBatchDialog();
    });
    document.getElementById('btn-quick-resumo').addEventListener('click', () => {
      switchView('view-resumo');
    });
    document.getElementById('btn-quick-admissao').addEventListener('click', () => {
      switchView('view-admissao');
    });

    // Formulário de Edição da Empresa
    document.getElementById('form-company-quick-edit').addEventListener('submit', (e) => {
      e.preventDefault();
      state.company.empresa = document.getElementById('inp-home-empresa').value.trim();
      state.company.cnpj = document.getElementById('inp-home-cnpj').value.trim();
      state.company.endereco = document.getElementById('inp-home-endereco').value.trim();
      state.company.inicioCiclo = document.getElementById('inp-home-iniciociclo').value;

      StorageManager.saveCompany(state.company);
      state.cycleDates = CalculoPonto.gerarDatasCiclo(state.company.inicioCiclo);
      renderHeaderInfo();
      showToast('Configurações da empresa salvas com sucesso!', 'success');
    });

    // Seletor de Colaborador no Cartão
    document.getElementById('select-active-employee').addEventListener('change', (e) => {
      state.activeEmployeeId = parseInt(e.target.value, 10);
      renderTimecard();
    });

    // Botões Anterior e Próximo no Cartão (Equivalente aos links da planilha)
    document.getElementById('btn-tc-prev').addEventListener('click', () => {
      if (state.activeEmployeeId > 1) {
        state.activeEmployeeId -= 1;
        renderTimecard();
      }
    });
    document.getElementById('btn-tc-next').addEventListener('click', () => {
      if (state.activeEmployeeId < state.employees.length) {
        state.activeEmployeeId += 1;
        renderTimecard();
      }
    });

    // Macro limparHoras
    document.getElementById('btn-tc-clear-hours').addEventListener('click', () => {
      const emp = state.employees.find(e => e.id === state.activeEmployeeId);
      document.getElementById('clear-hours-emp-name').textContent = emp ? emp.nome || `Slot ${emp.id}` : '';
      document.getElementById('modal-confirm-clear-hours').classList.add('active');
    });

    document.getElementById('btn-confirm-clear-hours-action').addEventListener('click', () => {
      StorageManager.clearTimecard(state.activeEmployeeId);
      document.getElementById('modal-confirm-clear-hours').classList.remove('active');
      renderTimecard();
      showToast('Horas do período limpas e eventos redefinidos para "normal".', 'success');
    });

    // Diálogo Macro folhaPonto()
    document.getElementById('btn-open-folha-batch-dialog').addEventListener('click', () => {
      openBatchDialog();
    });

    document.getElementById('btn-confirm-batch-print').addEventListener('click', () => {
      const inputStr = document.getElementById('inp-batch-interval').value;
      const res = CalculoPonto.parseIntervalo(inputStr, state.employees.length);
      const errEl = document.getElementById('batch-interval-error');

      if (!res.valid) {
        errEl.textContent = res.error;
        errEl.style.display = 'block';
        return;
      }
      errEl.style.display = 'none';
      document.getElementById('modal-folhaponto-dialog').classList.remove('active');

      PDFPrintManager.prepareBatchFolhaPontoPrint(res.list, state.company, state.employees, state.company.inicioCiclo);
    });

    // Impressão individual da folha de ponto
    document.getElementById('btn-folha-print-single').addEventListener('click', () => {
      PDFPrintManager.prepareBatchFolhaPontoPrint([state.activeEmployeeId], state.company, state.employees, state.company.inicioCiclo);
    });

    // Macro ExportarParaPDF() - Resumo, Cartão e Ficha
    document.getElementById('btn-resumo-pdf').addEventListener('click', () => {
      PDFPrintManager.exportToPDF(`Resumo_Horas_${state.company.inicioCiclo}.pdf`, 'resumo-printable-area');
    });
    document.getElementById('btn-resumo-print').addEventListener('click', () => {
      window.print();
    });

    document.getElementById('btn-tc-pdf').addEventListener('click', () => {
      const emp = state.employees.find(e => e.id === state.activeEmployeeId);
      const nomeSanit = (emp?.nome || 'funcionario').replace(/\s+/g, '_');
      PDFPrintManager.exportToPDF(`Cartao_Ponto_${nomeSanit}.pdf`, 'timecard-printable-area');
    });
    document.getElementById('btn-tc-print').addEventListener('click', () => {
      window.print();
    });

    // Macro limparFormulario (Ficha de Admissão)
    document.getElementById('btn-adm-clear').addEventListener('click', () => {
      limparFormularioAdmissao();
      showToast('Formulário de admissão limpo com sucesso.', 'info');
    });
    document.getElementById('btn-adm-reset').addEventListener('click', () => {
      limparFormularioAdmissao();
      showToast('Formulário de admissão limpo.', 'info');
    });

    // Salvar Admissão
    document.getElementById('form-admission').addEventListener('submit', (e) => {
      e.preventDefault();
      salvarAdmissao();
    });

    document.getElementById('btn-adm-pdf').addEventListener('click', () => {
      const nome = document.getElementById('adm-nome').value.trim() || 'ficha_admissao';
      PDFPrintManager.exportToPDF(`Ficha_Admissao_${nome.replace(/\s+/g, '_')}.pdf`, 'admission-printable-area');
    });
    document.getElementById('btn-adm-print').addEventListener('click', () => {
      window.print();
    });

    // Backup e Restauração
    document.getElementById('btn-export-backup').addEventListener('click', () => {
      StorageManager.exportBackup();
      showToast('Backup baixado com sucesso!', 'success');
    });

    const fileInput = document.getElementById('file-import-backup');
    document.getElementById('btn-import-backup').addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = StorageManager.importBackup(ev.target.result);
        if (res.success) {
          state.company = StorageManager.getCompany();
          state.employees = StorageManager.getEmployees();
          state.cycleDates = CalculoPonto.gerarDatasCiclo(state.company.inicioCiclo);
          init();
          showToast('Dados restaurados com sucesso!', 'success');
        } else {
          showToast(`Erro ao restaurar: ${res.error}`, 'danger');
        }
      };
      reader.readAsText(file);
    });

    // Fechar Modais
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
      });
    });

    // Form Modal de Edição de Funcionário
    document.getElementById('btn-open-new-emp-modal').addEventListener('click', () => {
      const emptySlot = state.employees.find(e => !e.nome || !e.nome.trim());
      openEmployeeEditModal(emptySlot ? emptySlot.id : null);
    });

    document.getElementById('form-edit-emp').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = parseInt(document.getElementById('edit-emp-id').value, 10);
      const nome = document.getElementById('edit-emp-nome').value.trim();
      const funcao = document.getElementById('edit-emp-funcao').value;
      const ctps = document.getElementById('edit-emp-ctps').value.trim();
      const matricula = document.getElementById('edit-emp-matricula').value.trim();
      const escala = document.getElementById('edit-emp-escala').value;

      if (id) {
        const emp = state.employees.find(e => e.id === id);
        if (emp) {
          emp.nome = nome;
          emp.funcao = funcao;
          emp.ctps = ctps;
          emp.matricula = matricula;
          emp.escala = escala;
          emp.ativo = true;
        }
      } else {
        const newId = state.employees.length + 1;
        state.employees.push({
          id: newId,
          nome,
          funcao,
          ctps,
          matricula,
          escala,
          ativo: true,
          cadastral: {}
        });
      }

      StorageManager.saveEmployees(state.employees);
      document.getElementById('modal-employee-edit').classList.remove('active');
      renderEmployeesGrid();
      renderResumoHoras();
      renderTimecard();
      showToast('Colaborador salvo com sucesso!', 'success');
    });
  }

  function openBatchDialog() {
    const modal = document.getElementById('modal-folhaponto-dialog');
    document.getElementById('batch-interval-error').style.display = 'none';
    document.getElementById('inp-batch-interval').value = `1-${state.employees.length}`;
    modal.classList.add('active');
  }

  function openEmployeeEditModal(empId) {
    const modal = document.getElementById('modal-employee-edit');
    const titleEl = document.getElementById('modal-emp-title');
    const emp = empId ? state.employees.find(e => e.id === empId) : null;

    document.getElementById('edit-emp-id').value = empId || '';
    if (emp && emp.nome) {
      titleEl.textContent = `Editar Colaborador (#${emp.id})`;
      document.getElementById('edit-emp-nome').value = emp.nome;
      document.getElementById('edit-emp-funcao').value = emp.funcao || FUNCOES_DISPONIVEIS[0];
      document.getElementById('edit-emp-ctps').value = emp.ctps || '';
      document.getElementById('edit-emp-matricula').value = emp.matricula || '';
      document.getElementById('edit-emp-escala').value = emp.escala || '6x1';
    } else {
      titleEl.textContent = empId ? `Cadastrar no Slot #${empId}` : 'Novo Colaborador';
      document.getElementById('edit-emp-nome').value = '';
      document.getElementById('edit-emp-funcao').value = FUNCOES_DISPONIVEIS[0];
      document.getElementById('edit-emp-ctps').value = '';
      document.getElementById('edit-emp-matricula').value = '';
      document.getElementById('edit-emp-escala').value = '6x1';
    }
    modal.classList.add('active');
  }

  // Macro limparFormulario
  function limparFormularioAdmissao() {
    document.getElementById('form-admission').reset();
    document.getElementById('adm-nome').value = '';
    document.getElementById('adm-data-admissao').value = '';
    document.getElementById('adm-jornada').value = '';
    document.getElementById('adm-escala').value = '6x1';
    document.getElementById('adm-salario').value = '';
    document.getElementById('adm-hora-entrada').value = '';
    document.getElementById('adm-intervalo').value = '';
    document.getElementById('adm-hora-saida').value = '';
    document.getElementById('adm-vt-ida-qtd').value = '1';
    document.getElementById('adm-vt-ida-val').value = 'R$ 4,30';
    document.getElementById('adm-vt-volta-qtd').value = '1';
    document.getElementById('adm-vt-volta-val').value = 'R$ 4,30';
    document.getElementById('adm-nome-pai').value = '';
    document.getElementById('adm-nome-mae').value = '';
    document.getElementById('adm-nome-conjuge').value = '';
    document.getElementById('adm-filhos-qtd').value = '';
    document.getElementById('adm-ctps-num').value = '';
    document.getElementById('adm-ctps-serie').value = '';
    document.getElementById('adm-ctps-uf').value = '';
    document.getElementById('adm-rg-num').value = '';
    document.getElementById('adm-rg-emissor').value = '';
    document.getElementById('adm-rg-uf').value = '';
    document.getElementById('adm-cpf').value = '';
    document.getElementById('adm-pis').value = '';
    document.getElementById('adm-reservista').value = '';
    document.getElementById('adm-reservista-cat').value = '';
    document.getElementById('adm-titulo').value = '';
    document.getElementById('adm-endereco').value = '';
    document.getElementById('adm-complemento').value = '';
    document.getElementById('adm-bairro').value = '';
    document.getElementById('adm-cep').value = '';
    document.getElementById('adm-cidade').value = '';
    document.getElementById('adm-telefone').value = '';
    document.getElementById('adm-celular').value = '';
  }

  function salvarAdmissao() {
    const nome = document.getElementById('adm-nome').value.trim();
    const funcao = document.getElementById('adm-funcao').value;
    const escala = document.getElementById('adm-escala').value;
    const ctpsNum = document.getElementById('adm-ctps-num').value.trim();
    const ctpsSerie = document.getElementById('adm-ctps-serie').value.trim();
    const ctpsFormat = ctpsNum ? `${ctpsNum}${ctpsSerie ? '/' + ctpsSerie : ''}` : '';

    // Encontra um slot vazio ou o primeiro disponível
    let slot = state.employees.find(e => !e.nome || !e.nome.trim());
    if (slot) {
      slot.nome = nome;
      slot.funcao = funcao;
      slot.escala = escala;
      slot.ctps = ctpsFormat;
      slot.ativo = true;
    } else {
      const newId = state.employees.length + 1;
      slot = {
        id: newId,
        nome,
        funcao,
        escala,
        ctps: ctpsFormat,
        matricula: '',
        ativo: true,
        cadastral: {}
      };
      state.employees.push(slot);
    }

    StorageManager.saveEmployees(state.employees);
    renderEmployeesGrid();
    renderResumoHoras();
    renderTimecard();

    showToast(`Funcionário ${nome} admitido e cadastrado com sucesso no Slot #${slot.id}!`, 'success');
  }

  // Notificações Toast
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
});
