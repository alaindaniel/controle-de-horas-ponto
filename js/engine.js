/**
 * Engine de Cálculos de Ponto e Regras de Negócio
 * Reproduz fielmente 100% das fórmulas da PLANILHA DE HORAS.ods
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CalculoPonto = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  /**
   * Converte string de hora 'HH:MM' em minutos totais desde 00:00
   * Retorna null se vazio ou inválido
   */
  function parseTimeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const parts = timeStr.trim().split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return (h * 60 + m) % 1440;
  }

  /**
   * Converte minutos em formato 'HH:MM'
   * Se negative for permitido e negativo, pode retornar '-HH:MM'
   */
  function formatMinutesToTime(mins, allowNegative = false) {
    if (mins === null || mins === undefined || isNaN(mins)) return '';
    const isNeg = mins < 0;
    const absMins = Math.round(Math.abs(mins));
    const h = Math.floor(absMins / 60);
    const m = absMins % 60;
    const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return isNeg && allowNegative ? `-${formatted}` : formatted;
  }

  /**
   * Retorna a carga horária em minutos baseada na escala
   * 6x1 -> 07:20 = 440 minutos
   * 12x36 -> 12:00 = 720 minutos
   */
  function getCargaHorariaMinutes(escala) {
    if (escala === '12x36') return 720; // 12h00
    return 440; // 7h20
  }

  /**
   * Calcula as horas de um dia específico
   * @param {Object} row - { evento, entrada, intervaloSaida, intervaloRetorno, saida }
   * @param {string} escala - '6x1' ou '12x36'
   */
  function calcularDia(row, escala = '6x1') {
    const evento = (row.evento || 'normal').toLowerCase().trim();
    const cargaMins = getCargaHorariaMinutes(escala);

    const entMins = parseTimeToMinutes(row.entrada);
    const saiMins = parseTimeToMinutes(row.saida);
    const intSaiMins = parseTimeToMinutes(row.intervaloSaida);
    const intRetMins = parseTimeToMinutes(row.intervaloRetorno);

    let totalTrabalhadoMins = null;
    let diferencaMins = null;
    let adNoturnoMins = null;
    let feriadoMins = null;
    let hs50Mins = null;
    let hs100Mins = null;
    let domMins = null;
    let faltasMins = null;

    // Se temos entrada e saída válidas, calculamos a jornada
    if (entMins !== null && saiMins !== null) {
      let duracaoBruta = (saiMins - entMins + 1440) % 1440;
      let duracaoIntervalo = 0;
      if (intSaiMins !== null && intRetMins !== null) {
        duracaoIntervalo = (intRetMins - intSaiMins + 1440) % 1440;
      }
      let liquido = duracaoBruta - duracaoIntervalo;
      if (liquido < 0) liquido += 1440;

      // Fórmula da planilha: IF(O2="12:00"; MOD(G-D;1) - MOD(F-E;1) + "1:00"; MOD(G-D;1) - MOD(F-E;1))
      if (cargaMins === 720) {
        liquido += 60; // +1h no 12x36
      }
      totalTrabalhadoMins = liquido;
    }

    // Coluna I (Diferença)
    // Fórmula: IF(OR(C<>"normal"; NOT(ISNUMBER(H)); H=O2); ""; H - O2)
    if (evento === 'normal' && totalTrabalhadoMins !== null) {
      if (totalTrabalhadoMins !== cargaMins) {
        diferencaMins = totalTrabalhadoMins - cargaMins;
      }
    }

    // Coluna J (Adicional Noturno)
    // Horário noturno: 22:00 (1320 min) às 07:00 (420 min)
    // Fórmula planilha:
    // IF(ISNUMBER(H); IF(D <= 22:00; IF(OR(G > 22:00; G < 7:00); MOD(G - 22:00, 1); ""); IF(OR(G > 22:00; G < 7:00); MOD(G - D, 1); "")); "")
    if (totalTrabalhadoMins !== null && entMins !== null && saiMins !== null) {
      const isSaidaNoite = saiMins > 1320 || saiMins < 420;
      if (entMins <= 1320) {
        if (isSaidaNoite) {
          adNoturnoMins = (saiMins - 1320 + 1440) % 1440;
        }
      } else {
        if (isSaidaNoite) {
          adNoturnoMins = (saiMins - entMins + 1440) % 1440;
        }
      }
    }

    // Coluna K (Feriado)
    // Fórmula: IF(C="feriado"; H; "")
    if (evento === 'feriado' && totalTrabalhadoMins !== null) {
      feriadoMins = totalTrabalhadoMins;
    }

    // Coluna L (Hs. 50%)
    // Fórmula: IF(OR(C<>"normal"; NOT(ISNUMBER(I)); I<=0; I<=00:10); ""; IF(I<=02:00; I; 02:00))
    if (evento === 'normal' && diferencaMins !== null && diferencaMins > 10) {
      if (diferencaMins <= 120) {
        hs50Mins = diferencaMins;
      } else {
        hs50Mins = 120; // Primeiras 2 horas
      }
    }

    // Coluna M (Hs. 100%)
    // Fórmula: IF(C="dobra"; H; IF(NOT(ISNUMBER(I)); ""; IF(I>02:00; I - 02:00; "")))
    if (evento === 'dobra') {
      if (totalTrabalhadoMins !== null) {
        hs100Mins = totalTrabalhadoMins;
      }
    } else if (evento === 'normal' && diferencaMins !== null && diferencaMins > 120) {
      hs100Mins = diferencaMins - 120;
    }

    // Coluna N (Dom - Domingo trabalhado)
    // Fórmula: IF(C="dom"; H; "")
    if (evento === 'dom' && totalTrabalhadoMins !== null) {
      domMins = totalTrabalhadoMins;
    }

    // Coluna O (Faltas / Atrasos)
    // Fórmula: IF(C="falta"; -O2; IF(I > -00:11; ""; I))
    if (evento === 'falta') {
      faltasMins = -cargaMins;
    } else if (evento === 'normal' && diferencaMins !== null) {
      // Se I <= -11 min (ou seja, atraso de 11 minutos ou mais)
      if (diferencaMins <= -11) {
        faltasMins = diferencaMins; // valor negativo
      }
    }

    return {
      evento,
      totalTrabalhadoMins,
      totalTrabalhado: formatMinutesToTime(totalTrabalhadoMins),
      diferencaMins,
      diferenca: diferencaMins !== null ? formatMinutesToTime(diferencaMins, true) : '',
      adNoturnoMins,
      adNoturno: formatMinutesToTime(adNoturnoMins),
      feriadoMins,
      feriado: formatMinutesToTime(feriadoMins),
      hs50Mins,
      hs50: formatMinutesToTime(hs50Mins),
      hs100Mins,
      hs100: formatMinutesToTime(hs100Mins),
      domMins,
      dom: formatMinutesToTime(domMins),
      faltasMins,
      faltas: faltasMins !== null ? formatMinutesToTime(faltasMins, true) : ''
    };
  }

  /**
   * Totaliza um mês (31 dias) de registros de um funcionário
   * @param {Array} daysRows - Lista de registros de 31 dias
   * @param {string} escala - '6x1' ou '12x36'
   */
  function calcularTotaisMes(daysRows, escala = '6x1') {
    let totAdNoturno = 0;
    let totFeriado = 0;
    let totHs50 = 0;
    let totHs100 = 0;
    let totDom = 0;
    let totFaltasNegativas = 0;
    let totTrabalhado = 0;

    const computedDays = daysRows.map(row => {
      const res = calcularDia(row, escala);
      if (res.adNoturnoMins) totAdNoturno += res.adNoturnoMins;
      if (res.feriadoMins) totFeriado += res.feriadoMins;
      if (res.hs50Mins) totHs50 += res.hs50Mins;
      if (res.hs100Mins) totHs100 += res.hs100Mins;
      if (res.domMins) totDom += res.domMins;
      if (res.faltasMins) totFaltasNegativas += res.faltasMins; // soma dos valores negativos
      if (res.totalTrabalhadoMins) totTrabalhado += res.totalTrabalhadoMins;
      return { ...row, ...res };
    });

    // Na planilha ODS, a linha de totais (Row 37) calcula:
    // O37: -(SUM(O6:O36)) -> inverte o sinal para ficar positivo
    const totFaltasPositivo = Math.abs(totFaltasNegativas);

    return {
      days: computedDays,
      totais: {
        totalTrabalhadoMins: totTrabalhado,
        totalTrabalhado: formatMinutesToTime(totTrabalhado),
        adNoturnoMins: totAdNoturno,
        adNoturno: formatMinutesToTime(totAdNoturno),
        feriadoMins: totFeriado,
        feriado: formatMinutesToTime(totFeriado),
        hs50Mins: totHs50,
        hs50: formatMinutesToTime(totHs50),
        hs100Mins: totHs100,
        hs100: formatMinutesToTime(totHs100),
        domMins: totDom,
        dom: formatMinutesToTime(totDom),
        faltasMins: totFaltasPositivo,
        faltas: formatMinutesToTime(totFaltasPositivo)
      }
    };
  }

  /**
   * Gera a lista de 31 datas a partir da data de início do ciclo
   * @param {string|Date} startDateStr - Data inicial (ex: '2026-06-21')
   */
  function gerarDatasCiclo(startDateStr) {
    const parts = (startDateStr || '2026-06-21').split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const result = [];

    const d = new Date(year, month, day);
    for (let i = 0; i < 31; i++) {
      const current = new Date(d);
      current.setDate(d.getDate() + i);

      const dd = String(current.getDate()).padStart(2, '0');
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const yyyy = current.getFullYear();
      const diaSem = diasSemana[current.getDay()];

      result.push({
        index: i + 1,
        isoDate: `${yyyy}-${mm}-${dd}`,
        label: `${dd}/${mm} - ${diaSem}`,
        dayOfMonth: dd,
        month: mm,
        year: yyyy,
        dayOfWeek: diaSem
      });
    }
    return result;
  }

  /**
   * Gera as datas mensais para a folha de ponto (do dia 1 ao último dia do mês)
   * Baseado na lógica da macro folhaPonto: 1º dia do mês seguinte ao ciclo ou mês escolhido
   */
  function gerarDatasFolhaPonto(year, monthIndex) {
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const result = [];

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, monthIndex, day);
      const dd = String(day).padStart(2, '0');
      const mm = String(monthIndex + 1).padStart(2, '0');
      const diaSem = diasSemana[d.getDay()];

      result.push({
        dayNumber: day,
        dateFormatted: `${dd}/${mm}/${year}`,
        dayOfWeek: diaSem,
        isoDate: `${year}-${mm}-${dd}`
      });
    }
    return result;
  }

  /**
   * Parser e validador do seletor de intervalo da macro folhaPonto (ex: '5-10', '3', '1-22')
   */
  function parseIntervalo(inputStr, maxLimit = 22) {
    if (!inputStr || typeof inputStr !== 'string') return { valid: false, error: 'Intervalo vazio.' };
    const str = inputStr.trim();
    if (!str) return { valid: false, error: 'Intervalo vazio.' };

    const parts = str.split('-').map(p => p.trim());
    if (parts.length === 1) {
      const num = parseInt(parts[0], 10);
      if (isNaN(num) || num < 1 || num > maxLimit) {
        return { valid: false, error: 'Seleção de página fora do intervalo!' };
      }
      return { valid: true, start: num, end: num, list: [num] };
    } else if (parts.length === 2) {
      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);
      if (isNaN(start) || isNaN(end) || start < 1 || start > maxLimit || end < 1 || end > maxLimit || start > end) {
        return { valid: false, error: 'Seleção de página fora do intervalo!' };
      }
      const list = [];
      for (let i = start; i <= end; i++) list.push(i);
      return { valid: true, start, end, list };
    }
    return { valid: false, error: 'Formato inválido. Use ex: 5-10 ou 3.' };
  }

  return {
    parseTimeToMinutes,
    formatMinutesToTime,
    getCargaHorariaMinutes,
    calcularDia,
    calcularTotaisMes,
    gerarDatasCiclo,
    gerarDatasFolhaPonto,
    parseIntervalo
  };
});
