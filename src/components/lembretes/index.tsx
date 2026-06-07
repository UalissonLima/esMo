import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where } from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

interface LembreteType {
    id: string;
    texto: string;
    data: string;
    hora: string;
    concluido: boolean;
    userId: string;
}

export default function Lembretes() {
    const [lembretes, setLembretes] = useState<LembreteType[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [idEdicao, setIdEdicao] = useState<string | null>(null);
    const [texto, setTexto] = useState("");
    const [dataSelecionada, setDataSelecionada] = useState(new Date());
    const [horaSelecionada, setHoraSelecionada] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const auth = getAuth();

    async function carregarLembretes(uid: string) {
        try {
            const q = query(
                collection(db, "lembretes"),
                where("userId", "==", uid),
                orderBy("data", "asc")
            );

            const querySnapshot = await getDocs(q);
            const lista: LembreteType[] = [];

            querySnapshot.forEach((documento) => {
                const dados = documento.data();
                lista.push({
                    id: documento.id,
                    texto: dados.texto,
                    data: dados.data,
                    hora: dados.hora,
                    concluido: dados.concluido ?? false,
                    userId: dados.userId,
                });
            });

            lista.sort((a, b) => {
                if (a.concluido && !b.concluido) return 1;
                if (!a.concluido && b.concluido) return -1;
                return 0;
            });

            setLembretes(lista);
        } catch (erro) {
            console.error("ERRO CRÍTICO NO FIREBASE:", erro);
            Alert.alert("Erro", "Falha ao carregar dados. Verifique o console.");
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                carregarLembretes(user.uid);
            } else {
                setLembretes([]);
                Alert.alert("Aviso", "Usuário não autenticado.");
            }
        });

        return () => unsubscribe();
    }, []);

    const formatarDataBR = (dataStr: string) => {
        if (!dataStr) return "";
        const [ano, mes, dia] = dataStr.split("-");
        return `${dia}/${mes}/${ano}`;
    };

    function obterStatus(item: LembreteType) {
        if (item.concluido) return { label: "Concluído", cor: "#10B981" };

        const agora = new Date();
        const [ano, mes, dia] = item.data.split("-").map(Number);
        const [horas, minutos] = item.hora.split(":").map(Number);
        const dataPrazo = new Date(ano, mes - 1, dia, horas, minutos);

        if (agora > dataPrazo) {
            return { label: "Atrasado", cor: "#EF4444" };
        }
        return { label: "Pendente", cor: "#3B82F6" };
    }

    async function salvarLembrete() {
        if (!texto.trim()) return;

        const usuarioLogado = auth.currentUser;
        if (!usuarioLogado) {
            Alert.alert("Erro", "Sessão expirada. Faça login novamente.");
            return;
        }

        const ano = dataSelecionada.getFullYear();
        const mes = String(dataSelecionada.getMonth() + 1).padStart(2, "0");
        const dia = String(dataSelecionada.getDate()).padStart(2, "0");
        const dataFormatada = `${ano}-${mes}-${dia}`;

        const horas = String(horaSelecionada.getHours()).padStart(2, "0");
        const minutos = String(horaSelecionada.getMinutes()).padStart(2, "0");
        const horaFormatada = `${horas}:${minutos}`;

        try {
            if (idEdicao) {
                const docRef = doc(db, "lembretes", idEdicao);
                await updateDoc(docRef, {
                    texto,
                    data: dataFormatada,
                    hora: horaFormatada,
                });
            } else {
                await addDoc(collection(db, "lembretes"), {
                    userId: usuarioLogado.uid,
                    texto,
                    data: dataFormatada,
                    hora: horaFormatada,
                    concluido: false,
                    timestamp: new Date()
                });
            }

            fecharModal();
            carregarLembretes(usuarioLogado.uid);
        } catch (erro) {
            console.log("Erro ao salvar:", erro);
            Alert.alert("Erro", "Não foi possível salvar o lembrete.");
        }
    }

    async function alternarConcluir(item: LembreteType) {
        const usuarioLogado = auth.currentUser;
        if (!usuarioLogado) return;

        try {
            const docRef = doc(db, "lembretes", item.id);
            await updateDoc(docRef, { concluido: !item.concluido });
            carregarLembretes(usuarioLogado.uid);
        } catch (erro) {
            console.log(erro);
        }
    }

    async function apagarLembrete(id: string) {
        const usuarioLogado = auth.currentUser;
        if (!usuarioLogado) return;

        Alert.alert(
            "Confirmar exclusão",
            "Deseja realmente apagar este lembrete?",
            [
                {
                    text: "Não",
                    style: "cancel" 
                },
                {
                    text: "Sim",
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, "lembretes", id));
                            carregarLembretes(usuarioLogado.uid);
                        } catch (erro) {
                            console.log(erro);
                            Alert.alert("Erro", "Não foi possível apagar o lembrete.");
                        }
                    }
                }
            ]
        );
    }

    function prepararEdicao(item: LembreteType) {
        setIdEdicao(item.id);
        setTexto(item.texto);

        const [ano, mes, dia] = item.data.split("-").map(Number);
        const [horas, minutos] = item.hora.split(":").map(Number);

        setDataSelecionada(new Date(ano, mes - 1, dia));
        setHoraSelecionada(new Date(ano, mes - 1, dia, horas, minutos));
        setModalVisible(true);
    }

    function fecharModal() {
        setModalVisible(false);
        setIdEdicao(null);
        setTexto("");
        setDataSelecionada(new Date());
        setHoraSelecionada(new Date());
    }

    return (
        <View style={styles.container}>
            <Text style={styles.tituloSecao}>Seus Lembretes</Text>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 20 }}>
                {lembretes.length === 0 ? (
                    <Text style={styles.txtVazio}>Nenhum lembrete para exibir.</Text>
                ) : (
                    lembretes.map((item) => {
                        const status = obterStatus(item);
                        return (
                            <View
                                key={item.id}
                                style={[
                                    styles.faixaLembrete,
                                    item.concluido && styles.faixaConcluida
                                ]}
                            >
                                <View style={styles.linhaTopo}>
                                    <Text style={[styles.txtStatus, { color: status.cor }]}>
                                        {status.label}
                                    </Text>
                                    <View style={styles.infoAgendamento}>
                                        <Icon name="calendar-today" size={12} color={item.concluido ? "#9ca3af" : "#6b7280"} style={{ marginRight: 4 }} />
                                        <Text style={[styles.txtData, item.concluido && styles.txtDesativado]}>
                                            {formatarDataBR(item.data)}
                                        </Text>
                                        <Icon name="access-time" size={12} color={item.concluido ? "#9ca3af" : "#6b7280"} style={{ marginLeft: 8, marginRight: 4 }} />
                                        <Text style={[styles.txtHora, item.concluido && styles.txtDesativado]}>
                                            {item.hora}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.linhaConteudo}>
                                    <View style={styles.blocoTexto}>
                                        <Text style={[styles.txtComentario, item.concluido && styles.txtComentarioConcluido]}>
                                            {item.texto}
                                        </Text>
                                    </View>

                                    <View style={styles.blocoBotoes}>
                                        <TouchableOpacity onPress={() => alternarConcluir(item)} style={styles.btnAcaoPequeno}>
                                            <Icon name={item.concluido ? "check-box" : "check-box-outline-blank"} size={20} color={item.concluido ? "#10B981" : "#6B7280"} />
                                        </TouchableOpacity>

                                        {!item.concluido && (
                                            <TouchableOpacity onPress={() => prepararEdicao(item)} style={styles.btnAcaoPequeno}>
                                                <Icon name="edit" size={20} color="#2563eb" />
                                            </TouchableOpacity>
                                        )}

                                        <TouchableOpacity onPress={() => apagarLembrete(item.id)} style={styles.btnAcaoPequeno}>
                                            <Icon name="delete" size={20} color="#dc2626" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.btnAdicionar} onPress={() => setModalVisible(true)}>
                    <Text style={styles.txtBtnAdicionar}>Adicionar Lembrete</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={fecharModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitulo}>{idEdicao ? "Editar Lembrete" : "Novo Lembrete"}</Text>

                        <View style={styles.dateTimeContainer}>
                            <TouchableOpacity style={styles.btnPicker} onPress={() => setShowDatePicker(true)}>
                                <Icon name="calendar-today" size={20} color="#333" />
                                <Text style={styles.txtPicker}>
                                    {dataSelecionada.toLocaleDateString('pt-BR')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.btnPicker} onPress={() => setShowTimePicker(true)}>
                                <Icon name="access-time" size={20} color="#333" />
                                <Text style={styles.txtPicker}>
                                    {String(horaSelecionada.getHours()).padStart(2, '0')}:{String(horaSelecionada.getMinutes()).padStart(2, '0')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={dataSelecionada}
                                mode="date"
                                display="default"
                                onChange={(event, date) => {
                                    setShowDatePicker(false);
                                    if (date) setDataSelecionada(date);
                                }}
                            />
                        )}

                        {showTimePicker && (
                            <DateTimePicker
                                value={horaSelecionada}
                                mode="time"
                                is24Hour={true}
                                display="default"
                                onChange={(event, date) => {
                                    setShowTimePicker(false);
                                    if (date) setHoraSelecionada(date);
                                }}
                            />
                        )}

                        <Text style={styles.txtContador}>
                            Lembrete {String(texto.length).padStart(3, "0")}/250
                        </Text>

                        <TextInput
                            style={styles.inputTexto}
                            placeholder="Escreva os detalhes do lembrete..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            maxLength={250}
                            value={texto}
                            onChangeText={setTexto}
                        />

                        <View style={styles.modalAcoes}>
                            <TouchableOpacity style={styles.btnModalSalvar} onPress={salvarLembrete}>
                                <Text style={styles.txtBtnModal}>Salvar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnModalCancelar} onPress={fecharModal}>
                                <Text style={styles.txtBtnModal}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        backgroundColor: "#f9fafb"
    },
    tituloSecao: {
        fontSize: 16,
        fontWeight: "700",
        color: "#374151",
        marginHorizontal: 20,
        marginTop: 15,
        marginBottom: 10,
    },
    scrollContainer: {
        flex: 1,
        width: "100%",
    },
    txtVazio: {
        textAlign: "center",
        color: "#9ca3af",
        marginTop: 40,
        fontSize: 14,
    },
    faixaLembrete: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginHorizontal: 20,
        marginBottom: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
    },
    faixaConcluida: {
        backgroundColor: "#f3f4f6",
        opacity: 0.6,
    },
    linhaTopo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
        paddingBottom: 6,
        marginBottom: 6,
    },
    infoAgendamento: {
        flexDirection: "row",
        alignItems: "center",
    },
    txtStatus: {
        fontSize: 10,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    txtData: {
        fontSize: 12,
        fontWeight: "600",
        color: "#4b5563",
    },
    txtHora: {
        fontSize: 12,
        fontWeight: "600",
        color: "#4b5563",
    },
    txtDesativado: {
        color: "#9ca3af",
        textDecorationLine: "line-through",
    },
    linhaConteudo: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    blocoTexto: {
        width: "70%",
        marginRight: 6,
    },
    txtComentario: {
        fontSize: 14,
        color: "#1f2937",
        lineHeight: 18,
    },
    txtComentarioConcluido: {
        color: "#9ca3af",
        textDecorationLine: "line-through",
    },
    blocoBotoes: {
        width: "30%",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    btnAcaoPequeno: {
        padding: 4,
        marginLeft: 2,
    },
    footer: {
        width: "100%",
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: "transparent",
    },
    btnAdicionar: {
        backgroundColor: "#10B981",
        flexDirection: "row",
        width: "100%",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        elevation: 1,
    },
    txtBtnAdicionar: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: "90%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
    },
    modalTitulo: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
        color: "#1f2937",
    },
    dateTimeContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: 15,
    },
    btnPicker: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        padding: 12,
        borderRadius: 8,
        width: "48%",
        justifyContent: "center",
    },
    txtPicker: {
        marginLeft: 8,
        color: "#1f2937",
        fontWeight: "500",
        fontSize: 14,
    },
    txtContador: {
        textAlign: "right",
        fontSize: 12,
        color: "#6b7280",
        marginBottom: 6,
    },
    inputTexto: {
        backgroundColor: "#f3f4f6",
        borderRadius: 8,
        padding: 12,
        height: 100,
        width: "100%",
        textAlignVertical: 'top',
        textAlign: 'justify',
        fontSize: 14,
        color: "#1f2937",
        marginBottom: 20,
    },
    modalAcoes: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    btnModalSalvar: {
        backgroundColor: "#10B981",
        padding: 14,
        borderRadius: 8,
        width: "48%",
        alignItems: "center",
    },
    btnModalCancelar: {
        backgroundColor: "#6B7280",
        padding: 14,
        borderRadius: 8,
        width: "48%",
        alignItems: "center",
    },
    txtBtnModal: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 15,
    },
});