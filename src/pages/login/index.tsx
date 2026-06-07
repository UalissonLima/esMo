import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
    onAuthStateChanged,
    User
} from "firebase/auth";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function Login() {
    const [isCadastro, setIsCadastro] = useState(false);
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [usuarioLogado, setUsuarioLogado] = useState<User | null>(null);
    const veioDeCadastroRef = useRef(false);

    const auth = getAuth();
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUsuarioLogado(user);
                console.log("Usuário detectado e ativo:", user.email);

                if (veioDeCadastroRef.current) {
                    veioDeCadastroRef.current = false;
                } else {
                    Alert.alert("Bem-vindo de volta!", `Logado como: ${user.displayName || user.email}`);
                }

            } else {
                setUsuarioLogado(null);
                console.log("Nenhum usuário logado no momento.");
            }
        });

        return unsubscribe;
    }, []);

    async function handleEsqueciSenha() {
        const emailLimpo = email.trim();

        if (!emailLimpo) {
            Alert.alert(
                "Campo Vazio",
                "Por favor, digite seu e-mail no campo de texto antes de clicar em recuperar senha."
            );
            return;
        }

        setCarregando(true);

        try {
            auth.languageCode = "pt-BR";
            await sendPasswordResetEmail(auth, emailLimpo);

            Alert.alert(
                "E-mail Enviado!",
                `Enviamos um link de redefinição para:\n${emailLimpo}\n\nVerifique sua caixa de entrada, aba de promoções e a pasta de Spam.`
            );
        } catch (error: any) {
            console.error("Erro detalhado do Firebase:", error.code, error.message);

            let msg = "Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde.";

            if (error.code === "auth/invalid-email") {
                msg = "O formato do e-mail digitado é inválido. Verifique se digitou corretamente.";
            } else if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
                msg = "Este e-mail não está cadastrado em nossa base de dados.";
            } else if (error.code === "auth/too-many-requests") {
                msg = "Muitas solicitações seguidas. Aguarde alguns minutos antes de tentar novamente.";
            }

            Alert.alert("Erro ao Redefinir", msg);
        } finally {
            setCarregando(false);
        }
    }

    async function handleAutenticacao() {
        const emailLimpo = email.trim();
        const nomeLimpo = nome.trim();

        if (!emailLimpo || !senha.trim()) {
            Alert.alert("Erro", "Preencha todos os campos obrigatórios.");
            return;
        }

        if (isCadastro && !nomeLimpo) {
            Alert.alert("Erro", "Por favor, insira o seu nome.");
            return;
        }

        setCarregando(true);

        try {
            if (isCadastro) {
                veioDeCadastroRef.current = true;

                const userCredential = await createUserWithEmailAndPassword(auth, emailLimpo, senha);

                await updateProfile(userCredential.user, { displayName: nomeLimpo });

                Alert.alert("Sucesso", `Conta criada com sucesso!\nSeja bem-vindo, ${nomeLimpo}!`);
            } else {
                veioDeCadastroRef.current = false;

                await signInWithEmailAndPassword(auth, emailLimpo, senha);
            }
        } catch (error: any) {
            veioDeCadastroRef.current = false;

            console.error("Erro na autenticação:", error.code, error.message);
            let mensagemErro = "Ocorreu um erro. Tente novamente.";

            if (error.code === "auth/email-already-in-use") {
                mensagemErro = "Este e-mail já está cadastrado por outro usuário.";
            } else if (error.code === "auth/invalid-email") {
                mensagemErro = "O formato do e-mail inserido é inválido.";
            } else if (error.code === "auth/weak-password") {
                mensagemErro = "A senha deve ter pelo menos 6 dígitos.";
            } else if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                mensagemErro = "E-mail ou senha incorretos.";
            }

            Alert.alert("Falha na Autenticação", mensagemErro);
        } finally {
            setCarregando(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.card}>
                <Icon name="school" size={50} color="#3B82F6" style={styles.logo} />
                <Text style={styles.titulo}>{isCadastro ? "Criar Conta" : "Seja bem-vindo ao esMo"}</Text>
                <Text style={styles.subtitulo}>
                    {isCadastro ? "Preencha os dados abaixo" : "Faça login para continuar"}
                </Text>

                {isCadastro && (
                    <View style={styles.inputArea}>
                        <Icon name="person" size={20} color="#0000" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nome"
                            value={nome}
                            onChangeText={setNome}
                        />
                    </View>
                )}

                <View style={styles.inputArea}>
                    <Icon name="email" size={20} color="#0000" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="E-mail"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <View style={styles.inputArea}>
                    <Icon name="lock" size={20} color="#0000" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Senha"
                        secureTextEntry
                        autoCapitalize="none"
                        value={senha}
                        onChangeText={setSenha}
                    />
                </View>

                {!isCadastro && (
                    <TouchableOpacity
                        style={styles.btnEsqueciSenha}
                        onPress={handleEsqueciSenha}
                        disabled={carregando}
                    >
                        <Text style={styles.txtEsqueciSenha}>Esqueceu sua senha?</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.btnPrincipal}
                    onPress={handleAutenticacao}
                    disabled={carregando}
                >
                    {carregando ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.txtBtnPrincipal}>{isCadastro ? "Cadastrar" : "Entrar"}</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.btnAlternar}
                    disabled={carregando}
                    onPress={() => {
                        setIsCadastro(!isCadastro);
                        setNome("");
                        setEmail("");
                        setSenha("");
                    }}
                >
                    <Text style={styles.txtBtnAlternar}>
                        {isCadastro ? "Já tem uma conta? Entre aqui" : "Não tem uma conta? Cadastre-se aqui"}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        width: "85%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        alignItems: "center",
    },
    logo: {
        marginBottom: 10,
    },
    titulo: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#1f2937",
    },
    subtitulo: {
        fontSize: 14,
        color: "#6b7280",
        marginTop: 4,
        marginBottom: 24,
    },
    inputArea: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        borderRadius: 8,
        width: "100%",
        marginBottom: 16,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 14,
        color: "#1f2937",
    },
    btnEsqueciSenha: {
        alignSelf: "flex-end",
        marginBottom: 20,
        paddingVertical: 4,
    },
    txtEsqueciSenha: {
        color: "#6B7280",
        fontSize: 13,
        fontWeight: "500",
    },
    btnPrincipal: {
        backgroundColor: "#3B82F6",
        width: "100%",
        height: 48,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
    },
    txtBtnPrincipal: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    btnAlternar: {
        marginTop: 20,
        padding: 5,
    },
    txtBtnAlternar: {
        color: "#3B82F6",
        fontSize: 13,
        fontWeight: "500",
    },
});