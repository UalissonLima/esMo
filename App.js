import React, { useState, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Importações
import Cronometro from "./src/components/cronometro";
import Disciplina from "./src/pages/disciplina";
import Historico from "./src/pages/historico";
import Home from "./src/pages/home";
import Menu from "./src/components/menu";
import Login from "./src/pages/login";

export default function App() {
  // Em JavaScript puro, removemos as tipagens dos Hooks (<User | null> e <AbaType>)
  const [user, setUser] = useState(null);
  const [carregandoAutenticacao, setCarregandoAutenticacao] = useState(true);
  const [abaAtual, setAbaAtual] = useState("home");

  useEffect(() => {
    const auth = getAuth();

    // Escuta ativa do Firebase para saber se o usuário está logado ou não
    const unsubscribe = onAuthStateChanged(auth, (usuarioLogado) => {
      setUser(usuarioLogado);
      setCarregandoAutenticacao(false);
    });

    return unsubscribe; // Limpa o listener ao desmontar
  }, []);

  const renderizarTela = () => {
    switch (abaAtual) {
      case "home":
        return <Home />;
      case "disciplinas":
        return <Disciplina />;
      case "historico":
        return <Historico />;
      default:
        return <Home />;
    }
  };

  // Enquanto o Firebase checa a sessão antiga, mostra um loading na tela
  if (carregandoAutenticacao) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // SE NÃO ESTIVER LOGADO: Renderiza apenas a tela de Login
  if (!user) {
    return (
      <View style={styles.container}>
        <Login />
        <StatusBar style="auto" />
      </View>
    );
  }

  // SE ESTIVER LOGADO: Libera o restante do aplicativo
  return (
    <View style={styles.container}>
      <Cronometro />

      <View style={styles.conteudoTela}>{renderizarTela()}</View>

      <Menu abaAtiva={abaAtual} aoMudarAba={setAbaAtual} />

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  conteudoTela: {
    flex: 1,
    width: "100%",
  },
});
