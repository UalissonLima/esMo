import React, { useEffect, useState } from "react";
import {
    TouchableOpacity,
    Text,
    View,
    StyleSheet,
    Modal,
    FlatList,
    Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import AddDisciplina from "../../components/AddDisciplina";
import { collection, deleteDoc, doc, updateDoc, arrayRemove, query, where, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase";
import AddTopico from "../../components/addTopico";

interface DisciplinaType {
    id: string;
    nome: string;
    topicos?: string[];
    userId: string;
}

export default function Disciplina() {
    const auth = getAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [modalVisibleTopico, setModalVisibleTopico] = useState(false);
    const [disciplinas, setDisciplinas] = useState<DisciplinaType[]>([]);
    const [idsExpandidos, setIdsExpandidos] = useState<string[]>([]);
    const [idDisciplinaEdicao, setIdDisciplinaEdicao] = useState<string | undefined>();
    const [nomeDisciplinaEdicao, setNomeDisciplinaEdicao] = useState('');
    const [modalExcluir, setModalExcluir] = useState(false);
    const [disciplinaExcluir, setDisciplinaExcluir] = useState<DisciplinaType | null>(null);
    const [idDisciplinaTopico, setIdDisciplinaTopico] = useState<string | undefined>();
    const [nomeTopicoEdicao, setNomeTopicoEdicao] = useState<string>('');
    const [topicoAntigoEdicao, setTopicoAntigoEdicao] = useState<string>('');
    const [modalExcluirTopico, setModalExcluirTopico] = useState(false);
    const [idDisciplinaExcluirTopico, setIdDisciplinaExcluirTopico] = useState<string>('');
    const [textoTopicoExcluir, setTextoTopicoExcluir] = useState<string>('');

    useEffect(() => {
        const usuarioLogado = auth.currentUser;

        if (!usuarioLogado) {
            console.log("Nenhum usuário autenticado encontrado.");
            return;
        }

        const q = query(
            collection(db, "disciplinas"),
            where("userId", "==", usuarioLogado.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const lista: DisciplinaType[] = [];
            querySnapshot.forEach(documento => {
                const dados = documento.data();
                lista.push({
                    id: documento.id,
                    nome: dados.nome,
                    topicos: dados.topico || [],
                    userId: dados.userId,
                });
            });
            setDisciplinas(lista);
        }, (erro) => {
            console.log("Erro ao escutar disciplinas:", erro);
            Alert.alert("Erro", "Falha ao carregar suas disciplinas.");
        });

        return () => unsubscribe();
    }, []);

    function toggleExpandir(id: string) {
        if (idsExpandidos.includes(id)) {
            setIdsExpandidos(idsExpandidos.filter(itemRef => itemRef !== id));
        } else {
            setIdsExpandidos([...idsExpandidos, id]);
        }
    }

    function abrirModalTopicoNovo(disciplinaId: string) {
        setIdDisciplinaTopico(disciplinaId);
        setNomeTopicoEdicao('');
        setTopicoAntigoEdicao('');

        if (!idsExpandidos.includes(disciplinaId)) {
            setIdsExpandidos([...idsExpandidos, disciplinaId]);
        }

        setModalVisibleTopico(true);
    }

    function editarDisciplina(disciplina: DisciplinaType) {
        setIdDisciplinaEdicao(disciplina.id);
        setNomeDisciplinaEdicao(disciplina.nome);
        setModalVisible(true);
    }

    function abrirModalTopicoEdicao(disciplinaId: string, textoDoTopico: string) {
        setIdDisciplinaTopico(disciplinaId);
        setNomeTopicoEdicao(textoDoTopico);
        setTopicoAntigoEdicao(textoDoTopico);
        setModalVisibleTopico(true);
    }

    function abrirExcluirTopico(disciplinaId: string, textoDoTopico: string) {
        setIdDisciplinaExcluirTopico(disciplinaId);
        setTextoTopicoExcluir(textoDoTopico);
        setModalExcluirTopico(true);
    }

    async function confirmarExcluirTopico() {
        if (!idDisciplinaExcluirTopico || !textoTopicoExcluir) return;
        try {
            const disciplinaRef = doc(db, 'disciplinas', idDisciplinaExcluirTopico);
            await updateDoc(disciplinaRef, {
                topico: arrayRemove(textoTopicoExcluir)
            });
            setModalExcluirTopico(false);
            setIdDisciplinaExcluirTopico('');
            setTextoTopicoExcluir('');
        } catch (erro) {
            console.log("Erro ao deletar tópico: ", erro);
        }
    }

    function abrirExcluirDisciplina(disciplina: DisciplinaType) {
        setDisciplinaExcluir(disciplina);
        setModalExcluir(true);
    }

    async function confirmarExcluirDisciplina() {
        if (!disciplinaExcluir) return;
        try {
            await deleteDoc(doc(db, 'disciplinas', disciplinaExcluir.id));
            setModalExcluir(false);
            setDisciplinaExcluir(null);
        } catch (erro) {
            console.log(erro);
        }
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.btnAddDisciplina}
                onPress={() => {
                    setIdDisciplinaEdicao(undefined);
                    setNomeDisciplinaEdicao('');
                    setModalVisible(true);
                }}
            >
                <Text style={styles.txtAddDisciplina}>Adicionar Disciplina</Text>
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide">
                <AddDisciplina
                    acaoModal={setModalVisible}
                    idDisciplina={idDisciplinaEdicao}
                    nomeInicial={nomeDisciplinaEdicao}
                    atualizarLista={() => { }}
                />
            </Modal>

            <FlatList
                data={disciplinas}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ marginTop: 20 }}
                renderItem={({ item }) => {
                    const estaExpandido = idsExpandidos.includes(item.id);

                    return (
                        <View style={styles.cardContainer}>
                            <TouchableOpacity
                                style={styles.cardDisciplina}
                                activeOpacity={0.7}
                                onPress={() => toggleExpandir(item.id)}
                            >
                                <View style={styles.containerTituloSeta}>
                                    <Icon
                                        name={estaExpandido ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                                        size={26}
                                        color="#555"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={styles.nomeDisciplina}>{item.nome}</Text>
                                </View>

                                <View style={styles.containerAcoes}>
                                    <TouchableOpacity
                                        style={[styles.botaoAcao, styles.botaoMais]}
                                        onPress={() => abrirModalTopicoNovo(item.id)}
                                    >
                                        <Icon name="add" size={24} color="white" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.botaoAcao, styles.botaoEditar]}
                                        onPress={() => editarDisciplina(item)}
                                    >
                                        <Icon name="edit" size={20} color="white" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.botaoAcao, styles.botaoExcluir]}
                                        onPress={() => abrirExcluirDisciplina(item)}
                                    >
                                        <Icon name="delete" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>

                            {estaExpandido && item.topicos && item.topicos.length > 0 && (
                                <View style={styles.containerListaTopicos}>
                                    {item.topicos.map((topico, index) => (
                                        <View key={index} style={styles.linhaTopico}>
                                            <Text style={styles.txtTopico}>• {topico}</Text>
                                            <View style={styles.containerAcoesTopico}>
                                                <TouchableOpacity
                                                    onPress={() => abrirModalTopicoEdicao(item.id, topico)}
                                                    style={styles.btnAcaoTopico}
                                                >
                                                    <Icon name="edit" size={16} color="#2563eb" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => abrirExcluirTopico(item.id, topico)}
                                                    style={styles.btnAcaoTopico}
                                                >
                                                    <Icon name="delete" size={16} color="#dc2626" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                }}
            />

            <Modal visible={modalVisibleTopico} animationType="slide">
                <View style={{ flex: 1 }}>
                    <AddTopico
                        acaoModal={setModalVisibleTopico}
                        idDisciplina={idDisciplinaTopico}
                        nomeInicial={nomeTopicoEdicao}
                        topicoAntigo={topicoAntigoEdicao}
                        atualizarLista={() => { }}
                    />
                </View>
            </Modal>

            <Modal visible={modalExcluir} transparent animationType="fade">
                <View style={styles.overlayExcluir}>
                    <View style={styles.modalExcluir}>
                        <Text style={styles.tituloExcluir}>Tem certeza que deseja apagar?</Text>
                        <Text style={styles.nomeExcluir}>{disciplinaExcluir?.nome}</Text>
                        <TouchableOpacity style={styles.btnSim} onPress={confirmarExcluirDisciplina}>
                            <Text style={styles.txtBtnModal}>Sim</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.btnNao}
                            onPress={() => {
                                setModalExcluir(false);
                                setDisciplinaExcluir(null);
                            }}
                        >
                            <Text style={styles.txtBtnModal}>Não</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={modalExcluirTopico} transparent animationType="fade">
                <View style={styles.overlayExcluir}>
                    <View style={styles.modalExcluir}>
                        <Text style={styles.tituloExcluir}>Tem certeza que deseja apagar?</Text>
                        <Text style={styles.nomeExcluir}>{textoTopicoExcluir}</Text>

                        <TouchableOpacity style={styles.btnSim} onPress={confirmarExcluirTopico}>
                            <Text style={styles.txtBtnModal}>Sim</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.btnNao}
                            onPress={() => {
                                setModalExcluirTopico(false);
                                setIdDisciplinaExcluirTopico('');
                                setTextoTopicoExcluir('');
                            }}
                        >
                            <Text style={styles.txtBtnModal}>Não</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: "#f5f5f5",
    },
    btnAddDisciplina: {
        backgroundColor: "#10B981",
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: "center",
    },
    txtAddDisciplina: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    cardContainer: {
        backgroundColor: "white",
        borderRadius: 12,
        marginBottom: 12,
        elevation: 3,
        overflow: 'hidden',
    },
    cardDisciplina: {
        width: "100%",
        padding: 15,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    containerTituloSeta: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    nomeDisciplina: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#111",
        flex: 1,
    },
    containerAcoes: {
        flexDirection: "row",
    },
    botaoAcao: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
    },
    botaoMais: { backgroundColor: "#10B981" },
    botaoEditar: { backgroundColor: "#3B82F6" },
    botaoExcluir: { backgroundColor: "#EF4444" },
    containerListaTopicos: {
        backgroundColor: "#fafafa",
        borderTopWidth: 1,
        borderTopColor: "#eee",
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    linhaTopico: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    txtTopico: {
        fontSize: 14,
        color: "#4b5563",
        flex: 1,
    },
    containerAcoesTopico: {
        flexDirection: "row",
    },
    btnAcaoTopico: {
        padding: 6,
        marginLeft: 10,
    },
    overlayExcluir: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalExcluir: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
    },
    tituloExcluir: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    nomeExcluir: {
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 20,
        color: "#555",
    },
    btnSim: {
        backgroundColor: '#EF4444',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    btnNao: {
        backgroundColor: '#6B7280',
        padding: 15,
        borderRadius: 10,
    },
    txtBtnModal: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
});