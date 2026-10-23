interface LeituraBalanca {
  peso_gramas: number;
  timestamp: Date;
}

class BalancaService {
  private static pesoAtual: number = 0;
  private static dataUltimaLeitura: Date = new Date();

  static registrarPeso(peso_gramas: number): void {
    this.pesoAtual = Number(peso_gramas);
    this.dataUltimaLeitura = new Date();
  }

  static obterPesoAtual(): LeituraBalanca {
    return {
      peso_gramas: this.pesoAtual,
      timestamp: this.dataUltimaLeitura
    };
  }
}

export default BalancaService;