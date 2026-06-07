import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import Icon from "react-native-vector-icons/MaterialIcons";
import Lembretes from "../../components/lembretes";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const auth = getAuth();
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setNomeUsuario(user.displayName || user.email?.split("@")[0] || "Usuário");
      }
    });

    return unsubscribe;
  }, []);

  function handleLogout() {
    Alert.alert(
      "Sair",
      "Tem certeza que deseja sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => signOut(auth).catch(erro => console.log("Erro ao sair:", erro))
        }
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.welcomeContainer}>
        <View style={styles.blocoTexto}>
          <Text style={styles.txtSaudacao}>Olá, {nomeUsuario}</Text>
          <Text style={styles.txtSubtitulo}>Pronto para os estudos de hoje?</Text>
        </View>

        <TouchableOpacity style={styles.btnLogout} onPress={handleLogout} activeOpacity={0.7}>
          <Icon name="logout" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.lembretesWrapper}>
        <Lembretes />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  welcomeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  blocoTexto: {
    flex: 1,
  },
  txtSaudacao: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  txtSubtitulo: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  btnLogout: {
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 50,
    marginLeft: 10,
  },
  lembretesWrapper: {
    flex: 1,
    marginTop: 10,
  },
});