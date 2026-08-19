/**
 * Camada de Persistência e Gerenciamento de Estado
 * Armazena no LocalStorage com suporte a Backup e Restauração
 */

const STORAGE_KEYS = {
  COMPANY: 'ponto_sys_company_v1',
  EMPLOYEES: 'ponto_sys_employees_v1',
  TIMECARDS: 'ponto_sys_timecards_v1', // Mapa: employeeId -> Array de 31 dias
  ADMISSIONS: 'ponto_sys_admissions_v1'
};

const StorageManager = {
  /**
   * Obtém os dados da empresa
   */
  getCompany() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMPANY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Erro ao ler dados da empresa:', e);
    }
    return { ...INITIAL_COMPANY_DATA };
  },

  /**
   * Salva os dados da empresa
   */
  saveCompany(companyData) {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(companyData));
  },

  /**
   * Obtém a lista de funcionários
   */
  getEmployees() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch (e) {
      console.error('Erro ao ler funcionários:', e);
    }
    const initial = JSON.parse(JSON.stringify(INITIAL_EMPLOYEES));
    this.saveEmployees(initial);
    return initial;
  },

  /**
   * Salva a lista de funcionários
   */
  saveEmployees(employees) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  },

  /**
   * Obtém os registros de ponto de um funcionário
   */
  getTimecard(employeeId) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TIMECARDS);
      const allCards = raw ? JSON.parse(raw) : {};
      if (allCards[employeeId] && Array.isArray(allCards[employeeId])) {
        return allCards[employeeId];
      }
    } catch (e) {
      console.error(`Erro ao ler cartão do funcionário ${employeeId}:`, e);
    }
    return this.createEmptyTimecard();
  },

  /**
   * Cria um cartão vazio padrão de 31 dias
   */
  createEmptyTimecard() {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push({
        dayIndex: i,
        evento: 'normal',
        entrada: '',
        intervaloSaida: '',
        intervaloRetorno: '',
        saida: ''
      });
    }
    return days;
  },

  /**
   * Salva o cartão de ponto de um funcionário
   */
  saveTimecard(employeeId, daysData) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TIMECARDS);
      const allCards = raw ? JSON.parse(raw) : {};
      allCards[employeeId] = daysData;
      localStorage.setItem(STORAGE_KEYS.TIMECARDS, JSON.stringify(allCards));
    } catch (e) {
      console.error(`Erro ao salvar cartão do funcionário ${employeeId}:`, e);
    }
  },

  /**
   * Limpa as horas de um cartão de ponto (Equivalente à macro limparHoras)
   * Limpa D6:G36 e restaura evento para 'normal'
   */
  clearTimecard(employeeId) {
    const fresh = this.createEmptyTimecard();
    this.saveTimecard(employeeId, fresh);
    return fresh;
  },

  /**
   * Exporta todo o estado do sistema como arquivo JSON
   */
  exportBackup() {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      company: this.getCompany(),
      employees: this.getEmployees(),
      timecards: JSON.parse(localStorage.getItem(STORAGE_KEYS.TIMECARDS) || '{}'),
      admissions: JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMISSIONS) || '{}')
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_ponto_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Importa backup JSON
   */
  importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.company) this.saveCompany(data.company);
      if (data.employees) this.saveEmployees(data.employees);
      if (data.timecards) localStorage.setItem(STORAGE_KEYS.TIMECARDS, JSON.stringify(data.timecards));
      if (data.admissions) localStorage.setItem(STORAGE_KEYS.ADMISSIONS, JSON.stringify(data.admissions));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Restaura os dados originais da planilha
   */
  resetToInitial() {
    localStorage.removeItem(STORAGE_KEYS.COMPANY);
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.TIMECARDS);
    localStorage.removeItem(STORAGE_KEYS.ADMISSIONS);
    this.getCompany();
    this.getEmployees();
  }
};
