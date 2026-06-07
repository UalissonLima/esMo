import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
    Dimensions
} from 'react-native';

import { collection, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase';
import AddRegistro from '../../components/addRegistro';

const { width } = Dimensions.get('window');

interface RegistroType {
    id: string;
    data: string;
    tempoEstudado: number;
    idDisciplina: string;
    nomeDisciplina: string;
    nomeTopico: string;
    comentario?: string;
    tiposSelecionados: string[];
    acertos?: number;
    erros?: number;
    nomeProvaSimulado?: string;
}

export default function Historico() {
    const auth = getAuth();
    const [registros, setRegistros] = useState<RegistroType[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
    const [registroSelecionado, setRegistroSelecionado] = useState<RegistroType | null>(null);

    useEffect(() => {
        const usuarioLogado = auth.currentUser;

        if (!usuarioLogado) {
            setCarregando(false);
            return;
        }

        const q = query(
            collection(db, "registros"),
            orderBy("data", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const dados: RegistroType[] = [];

            querySnapshot.forEach((docSnap) => {
                const item = docSnap.data();

                if (item.userId === usuarioLogado.uid) {
                    dados.push({
                        id: docSnap.id,
                        data: item.data,
                        tempoEstudado: item.tempoEstudado,
                        idDisciplina: item.idDisciplina,
                        nomeDisciplina: item.nomeDisciplina,
                        nomeTopico: item.nomeTopico,
                        comentario: item.comentario,
                        tiposSelecionados: item.tiposSelecionados || [],
                        acertos: item.acertos,
                        erros: item.erros,
                        nomeProvaSimulado: item.nomeProvaSimulado
                    });
                }
            });

            setRegistros(dados);
            setCarregando(false);
        }, (erro) => {
            console.log("Erro no listener do histórico:", erro);
            Alert.alert("Erro", "Não foi possível sincronizar o histórico.");
            setCarregando(false);
        });

        return () => unsubscribe();
    }, []);

    const formatarTempo = (segundosTotais: number) => {
        const hrs = Math.floor(segundosTotais / 3600);
        const mins = Math.floor((segundosTotais % 3600) / 60);
        const segs = segundosTotais % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
    };

    const formatarData = (dataIso: string) => {
        try {
            const d = new Date(dataIso);
            return d.toLocaleDateString('pt-BR');
        } catch {
            return "Data inválida";
        }
    };

    const confirmarDeletar = (id: string) => {
        Alert.alert(
            "Confirmar Exclusão",
            "Deseja realmente apagar este registro de estudo?",
            [
                { text: "Não", style: "cancel" },
                {
                    text: "Sim",
                    style: "destructive",
                    onPress: () => deletarRegistro(id)
                }
            ]
        );
    };

    const deletarRegistro = async (id: string) => {
        try {
            await deleteDoc(doc(db, "registros", id));
            Alert.alert("Sucesso", "Registro removido com sucesso.");
        } catch (erro) {
            console.log("Erro ao deletar:", erro);
            Alert.alert("Erro", "Não foi possível apagar o registro.");
        }
    };

    const abrirEdicao = (registro: RegistroType) => {
        setRegistroSelecionado(registro);
        setModalEdicaoAberto(true);
    };

    const verificarTipoEstudo = (tipos: string[], termos: string[]) => {
        return tipos.some(tipo =>
            termos.includes(tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
        );
    };

    if (carregando) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.txtCarregando}>Carregando histórico...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Histórico de Estudos</Text>

            {registros.length === 0 ? (
                <Text style={styles.txtVazio}>Nenhum registro encontrado.</Text>
            ) : (
                <FlatList
                    data={registros}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    style={styles.lista}
                    contentContainerStyle={styles.listaConteudo}
                    renderItem={({ item }) => {
                        const temQuestoesOuSimulado = verificarTipoEstudo(item.tiposSelecionados, ['questoes', 'simulado', 'simulados']);
                        const ehSimulado = verificarTipoEstudo(item.tiposSelecionados, ['simulado', 'simulados']);

                        return (
                            <View style={styles.card}>
                                <View style={styles.conteudoCard}>
                                    <View style={styles.linhaTopo}>
                                        <Text style={styles.txtData}>{formatarData(item.data)}</Text>
                                        <Text style={styles.txtTempo}>⏱️ {formatarTempo(item.tempoEstudado)}</Text>
                                    </View>

                                    <View style={styles.linhaDisciplina}>
                                        <Text style={styles.txtDisciplina}>{item.nomeDisciplina}</Text>
                                        <Text style={styles.txtTopico}>{item.nomeTopico}</Text>
                                    </View>

                                    {item.tiposSelecionados && item.tiposSelecionados.length > 0 && (
                                        <View style={styles.linhaTipos}>
                                            {item.tiposSelecionados.map((tipo, index) => (
                                                <View key={index} style={styles.tagTipo}>
                                                    <Text style={styles.txtTagTipo}>{tipo}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {temQuestoesOuSimulado && (
                                        <View style={styles.containerMetricas}>
                                            <Text style={styles.txtMetricas}>
                                                ✅ <Text style={styles.txtAcertos}>{item.acertos ?? 0} acertos</Text>  |  ❌ <Text style={styles.txtErros}>{item.erros ?? 0} erros</Text>
                                            </Text>

                                            {ehSimulado && item.nomeProvaSimulado && (
                                                <Text style={styles.txtNomeProva} numberOfLines={1}>
                                                    📝 Prova: {item.nomeProvaSimulado}
                                                </Text>
                                            )}
                                        </View>
                                    )}

                                    {item.comentario ? (
                                        <View style={styles.linhaComentario}>
                                            <Text style={styles.txtComentario}>
                                                "{item.comentario}"
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text style={[styles.txtComentario, { fontStyle: 'italic', color: '#9ca3af', marginTop: 6 }]}>
                                            Sem comentários.
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.containerBotoes}>
                                    <TouchableOpacity
                                        style={[styles.botaoAcao, styles.btnEditar]}
                                        onPress={() => abrirEdicao(item)}
                                    >
                                        <Text style={styles.txtBtnAcao}>Editar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.botaoAcao, styles.btnApagar]}
                                        onPress={() => confirmarDeletar(item.id)}
                                    >
                                        <Text style={styles.txtBtnAcao}>Apagar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }}
                />
            )}

            <Modal
                visible={modalEdicaoAberto}
                animationType="slide"
                onRequestClose={() => setModalEdicaoAberto(false)}
            >
                {registroSelecionado && (
                    <AddRegistro
                        tempoEstudado={registroSelecionado.tempoEstudado}
                        fecharModal={setModalEdicaoAberto}
                        reset={() => { }}
                        registroParaEditar={registroSelecionado}
                    />
                )}
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: 20,
        width: '100%',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        width: '100%',
    },
    titulo: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 15,
        paddingHorizontal: 15,
    },
    txtCarregando: {
        marginTop: 10,
        color: '#4b5563',
    },
    txtVazio: {
        textAlign: 'center',
        color: '#9ca3af',
        marginTop: 40,
        fontSize: 16,
    },
    lista: {
        flex: 1,
        width: '100%',
    },
    listaConteudo: {
        paddingHorizontal: 15,
        paddingBottom: 30,
        flexGrow: 1,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    conteudoCard: {
        flex: 1,
        paddingRight: 12,
    },
    linhaTopo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingBottom: 4,
    },
    txtData: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4b5563',
    },
    txtTempo: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563eb',
    },
    linhaDisciplina: {
        marginBottom: 4,
    },
    txtDisciplina: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    txtTopico: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 1,
    },
    linhaTipos: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
        marginBottom: 2,
    },
    tagTipo: {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 6,
        marginBottom: 4,
    },
    txtTagTipo: {
        fontSize: 11,
        color: '#1e40af',
        fontWeight: '600',
    },
    containerMetricas: {
        backgroundColor: '#f8fafc',
        borderLeftWidth: 3,
        borderLeftColor: '#cbd5e1',
        paddingHorizontal: 8,
        paddingVertical: 6,
        marginTop: 4,
        marginBottom: 4,
        borderRadius: 4,
    },
    txtMetricas: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '500',
    },
    txtAcertos: {
        color: '#16a34a',
        fontWeight: 'bold',
    },
    txtErros: {
        color: '#dc2626',
        fontWeight: 'bold',
    },
    txtNomeProva: {
        fontSize: 12,
        color: '#475569',
        marginTop: 3,
        fontWeight: '500',
        fontStyle: 'italic',
    },
    linhaComentario: {
        marginTop: 6,
        backgroundColor: '#f9fafb',
        padding: 6,
        borderRadius: 6,
    },
    txtComentario: {
        fontSize: 13,
        color: '#4b5563',
        textAlign: 'justify',
    },
    containerBotoes: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        minHeight: 80,
    },
    botaoAcao: {
        width: '100%',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4,
    },
    btnEditar: {
        backgroundColor: '#3B82F6',
    },
    btnApagar: {
        backgroundColor: '#EF4444',
    },
    txtBtnAcao: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
});