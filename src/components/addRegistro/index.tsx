import React, { useState, useEffect } from 'react';
import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Platform,
    Alert,
    Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase';

interface RegistroEdicaoType {
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

interface AddRegistroProps {
    tempoEstudado: number;
    fecharModal: React.Dispatch<React.SetStateAction<boolean>>;
    reset: () => void;
    registroParaEditar?: RegistroEdicaoType | null;
}

interface DisciplinaType {
    id: string;
    nome: string;
    topico: string[];
}

export default function AddRegistro({
    tempoEstudado,
    fecharModal,
    reset,
    registroParaEditar
}: AddRegistroProps) {
    const auth = getAuth();
    const [data, setData] = useState<Date>(new Date());
    const [mostrarCalendario, setMostrarCalendario] = useState(false);
    const [carregandoDados, setCarregandoDados] = useState(true);
    const [listaDisciplinas, setListaDisciplinas] = useState<DisciplinaType[]>([]);
    const [topicosFiltrados, setTopicosFiltrados] = useState<string[]>([]);
    const [modalDisciplinaAberto, setModalDisciplinaAberto] = useState(false);
    const [modalTopicoAberto, setModalTopicoAberto] = useState(false);
    const [idDisciplinaSel, setIdDisciplinaSel] = useState('');
    const [nomeDisciplinaSel, setNomeDisciplinaSel] = useState('');
    const [nomeTopicoSel, setNomeTopicoSel] = useState('');
    const [horas, setHoras] = useState('00');
    const [minutos, setMinutos] = useState('00');
    const [segundos, setSegundos] = useState('00');
    const [tiposSelecionados, setTiposSelecionados] = useState<string[]>([]);
    const tiposEstudo = ['Video Aula', 'Leitura', 'Anotação', 'Revisão', 'Questões', 'Simulado'];
    const [acertos, setAcertos] = useState('');
    const [erros, setErros] = useState('');
    const [nomeProvaSimulado, setNomeProvaSimulado] = useState('');
    const [comentario, setComentario] = useState('');

    useEffect(() => {
        async function buscarDadosFirebase() {
            const usuarioLogado = auth.currentUser;

            if (!usuarioLogado) {
                setCarregandoDados(false);
                return;
            }

            try {
                const q = query(
                    collection(db, "disciplinas"),
                    where("userId", "==", usuarioLogado.uid)
                );

                const querySnapshot = await getDocs(q);
                const dadosCarregados: DisciplinaType[] = [];

                querySnapshot.forEach((docSnap) => {
                    const dados = docSnap.data();
                    dadosCarregados.push({
                        id: docSnap.id,
                        nome: dados.nome,
                        topico: dados.topico || []
                    });
                });
                dadosCarregados.sort((a, b) => a.nome.localeCompare(b.nome));

                setListaDisciplinas(dadosCarregados);
            } catch (erro) {
                Alert.alert("Erro", "Não foi possível carregar as suas disciplinas.");
            } finally {
                setCarregandoDados(false);
            }
        }

        buscarDadosFirebase();
    }, []);

    useEffect(() => {
        if (carregandoDados) return;

        if (registroParaEditar) {
            setData(new Date(registroParaEditar.data));
            setIdDisciplinaSel(registroParaEditar.idDisciplina);
            setNomeDisciplinaSel(registroParaEditar.nomeDisciplina);
            setNomeTopicoSel(registroParaEditar.nomeTopico);
            setTiposSelecionados(registroParaEditar.tiposSelecionados || []);
            setComentario(registroParaEditar.comentario || '');
            setAcertos(registroParaEditar.acertos !== undefined ? String(registroParaEditar.acertos) : '');
            setErros(registroParaEditar.erros !== undefined ? String(registroParaEditar.erros) : '');
            setNomeProvaSimulado(registroParaEditar.nomeProvaSimulado || '');

            const hrs = Math.floor(registroParaEditar.tempoEstudado / 3600);
            const mins = Math.floor((registroParaEditar.tempoEstudado % 3600) / 60);
            const segs = registroParaEditar.tempoEstudado % 60;
            setHoras(String(hrs).padStart(2, '0'));
            setMinutos(String(mins).padStart(2, '0'));
            setSegundos(String(segs).padStart(2, '0'));

            const disciplinaEncontrada = listaDisciplinas.find(d => d.id === registroParaEditar.idDisciplina);
            if (disciplinaEncontrada) {
                setTopicosFiltrados(disciplinaEncontrada.topico);
            }
        } else {
            const horasIniciais = Math.floor(tempoEstudado / 3600);
            const minutosIniciais = Math.floor((tempoEstudado % 3600) / 60);
            const segundosIniciais = tempoEstudado % 60;

            setHoras(String(horasIniciais).padStart(2, '0'));
            setMinutos(String(minutosIniciais).padStart(2, '0'));
            setSegundos(String(segundosIniciais).padStart(2, '0'));
        }
    }, [tempoEstudado, registroParaEditar, carregandoDados, listaDisciplinas]);

    function selecionarDisciplinaOption(idDisc: string, nomeDisc: string) {
        setIdDisciplinaSel(idDisc);
        setNomeDisciplinaSel(nomeDisc);
        setNomeTopicoSel('');

        const disciplinaEncontrada = listaDisciplinas.find(d => d.id === idDisc);
        if (disciplinaEncontrada) {
            setTopicosFiltrados(disciplinaEncontrada.topico);
        } else {
            setTopicosFiltrados([]);
        }

        setModalDisciplinaAberto(false);
    }

    function alternarTipo(tipo: string) {
        if (tiposSelecionados.includes(tipo)) {
            setTiposSelecionados(tiposSelecionados.filter(item => item !== tipo));
        } else {
            setTiposSelecionados([...tiposSelecionados, tipo]);
        }
    }

    const exibindoQuestoes = tiposSelecionados.includes('Questões');
    const exibindoSimulado = tiposSelecionados.includes('Simulado');

    function limparFormulario() {
        setNomeDisciplinaSel('');
        setIdDisciplinaSel('');
        setNomeTopicoSel('');
        setTiposSelecionados([]);
        setAcertos('');
        setErros('');
        setNomeProvaSimulado('');
        setComentario('');
        setData(new Date());
    }

    const salvarRegistro = async () => {
        const usuarioLogado = auth.currentUser;
        if (!usuarioLogado) {
            Alert.alert("Erro", "Você precisa estar logado para salvar um registro.");
            return;
        }

        const tempoFinal =
            Number(horas || 0) * 3600 +
            Number(minutos || 0) * 60 +
            Number(segundos || 0);

        if (tempoFinal <= 0) {
            Alert.alert("Atenção", "O tempo estudado deve ser de pelo menos 1 segundo.");
            return;
        }

        if (!idDisciplinaSel || !nomeTopicoSel) {
            Alert.alert("Atenção", "Por favor, selecione uma Disciplina e um Tópico.");
            return;
        }

        if (tiposSelecionados.length === 0) {
            Alert.alert("Atenção", "Selecione pelo menos 1 Tipo de Estudo.");
            return;
        }

        const precisaValidarMetricas = exibindoQuestoes || exibindoSimulado;
        const numAcertos = Number(acertos || 0);
        const numErros = Number(erros || 0);

        if (precisaValidarMetricas && numAcertos === 0 && numErros === 0) {
            Alert.alert(
                "Métricas vazias",
                `Você selecionou ${exibindoSimulado ? 'Simulado' : 'Questões'}. Insira os acertos ou erros (ambos não podem ser zero).`
            );
            return;
        }

        if (exibindoSimulado && !nomeProvaSimulado.trim()) {
            Alert.alert("Atenção", "Digite o nome da prova realizada no simulado.");
            return;
        }

        const payloadRegistro: any = {
            userId: usuarioLogado.uid,
            data: data.toISOString(),
            tempoEstudado: tempoFinal,
            idDisciplina: idDisciplinaSel,
            nomeDisciplina: nomeDisciplinaSel,
            nomeTopico: nomeTopicoSel,
            tiposSelecionados,
            comentario: comentario.trim(),
        };

        if (precisaValidarMetricas) {
            payloadRegistro.acertos = numAcertos;
            payloadRegistro.erros = numErros;
        } else {
            payloadRegistro.acertos = null;
            payloadRegistro.erros = null;
        }

        if (exibindoSimulado) {
            payloadRegistro.nomeProvaSimulado = nomeProvaSimulado.trim();
        } else {
            payloadRegistro.nomeProvaSimulado = null;
        }

        try {
            if (registroParaEditar) {
                const registroRef = doc(db, "registros", registroParaEditar.id);
                await updateDoc(registroRef, payloadRegistro);
                Alert.alert("Sucesso", "Registro de estudo atualizado com sucesso!");
            } else {
                payloadRegistro.criadoEm = new Date();
                await addDoc(collection(db, "registros"), payloadRegistro);
                Alert.alert("Sucesso", "Registro de estudo salvo com sucesso!");
            }

            limparFormulario();
            reset();
            fecharModal(false);
        } catch (erro) {
            Alert.alert("Erro", "Houve um problema ao salvar no Firebase.");
        }
    };

    return (
        <ScrollView
            style={styles.safeArea}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.container}>

                <Text style={styles.titulo}>
                    {registroParaEditar ? "Editar Registro" : "Novo Registro"}
                </Text>

                <Text style={styles.label}>Data</Text>
                <TouchableOpacity
                    style={styles.select}
                    onPress={() => setMostrarCalendario(true)}
                >
                    <Text style={styles.textoSelect}>{data.toLocaleDateString('pt-BR')}</Text>
                </TouchableOpacity>

                {mostrarCalendario && (
                    <DateTimePicker
                        value={data}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                            setMostrarCalendario(false);
                            if (selectedDate) setData(selectedDate);
                        }}
                    />
                )}

                <Text style={styles.label}>Tempo Estudado</Text>
                <View style={styles.linhaTempo}>
                    <TextInput
                        style={styles.inputTempo}
                        value={horas}
                        onChangeText={setHoras}
                        keyboardType="numeric"
                        maxLength={2}
                    />
                    <Text style={styles.separador}>:</Text>
                    <TextInput
                        style={styles.inputTempo}
                        value={minutos}
                        onChangeText={setMinutos}
                        keyboardType="numeric"
                        maxLength={2}
                    />
                    <Text style={styles.separador}>:</Text>
                    <TextInput
                        style={styles.inputTempo}
                        value={segundos}
                        onChangeText={setSegundos}
                        keyboardType="numeric"
                        maxLength={2}
                    />
                </View>

                <Text style={styles.label}>Selecione a disciplina</Text>
                <TouchableOpacity
                    style={styles.select}
                    onPress={() => setModalDisciplinaAberto(true)}
                >
                    <Text style={styles.textoSelect}>
                        {nomeDisciplinaSel || "Selecione uma disciplina ▼"}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.label}>Selecione o Tópico</Text>
                <TouchableOpacity
                    style={[styles.select, !idDisciplinaSel && styles.selectDesabilitado]}
                    onPress={() => {
                        if (!idDisciplinaSel) {
                            Alert.alert("Aviso", "Selecione uma disciplina primeiro.");
                            return;
                        }
                        setModalTopicoAberto(true);
                    }}
                    disabled={!idDisciplinaSel}
                >
                    <Text style={styles.textoSelect}>
                        {nomeTopicoSel || (idDisciplinaSel ? "Selecione um tópico ▼" : "Selecione uma disciplina primeiro")}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.label}>Tipo de Estudo</Text>
                <View style={styles.containerTipos}>
                    {tiposEstudo.map(tipo => (
                        <TouchableOpacity
                            key={tipo}
                            style={[
                                styles.botaoTipo,
                                tiposSelecionados.includes(tipo) && styles.botaoSelecionado,
                            ]}
                            onPress={() => alternarTipo(tipo)}
                        >
                            <Text style={tiposSelecionados.includes(tipo) ? styles.textoSelecionado : styles.textoBotao}>
                                {tipo}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {exibindoSimulado && (
                    <View style={styles.containerCondicional}>
                        <Text style={styles.labelCondicional}>Nome do Simulado</Text>
                        <TextInput
                            style={styles.inputNomeSimulado}
                            placeholder="Ex: Enem 2023"
                            value={nomeProvaSimulado}
                            onChangeText={setNomeProvaSimulado}
                        />
                    </View>
                )}

                {(exibindoQuestoes || exibindoSimulado) && (
                    <View style={styles.containerCondicional}>
                        <Text style={styles.labelCondicional}>Métricas de Desempenho</Text>
                        <View style={styles.linhaMetricas}>
                            <View style={styles.blocoMetrica}>
                                <Text style={styles.subLabelMetrica}>Acertos</Text>
                                <TextInput
                                    style={[styles.inputMetrica, { borderColor: '#10B981' }]}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    value={acertos}
                                    onChangeText={setAcertos}
                                />
                            </View>

                            <View style={styles.blocoMetrica}>
                                <Text style={styles.subLabelMetrica}>Erros</Text>
                                <TextInput
                                    style={[styles.inputMetrica, { borderColor: '#EF4444' }]}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    value={erros}
                                    onChangeText={setErros}
                                />
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.containerComentarioHeader}>
                    <Text style={styles.label}>Como foi seu estudo? <Text style={styles.labelOpcional}>(Opcional)</Text></Text>
                    <Text style={styles.contadorCaracteres}>
                        {String(comentario.length).padStart(3, '0')}/250
                    </Text>
                </View>
                <TextInput
                    style={styles.inputComentario}
                    placeholder="Descreva brevemente pontos importantes, dificuldades..."
                    placeholderTextColor="#9ca3af"
                    value={comentario}
                    onChangeText={setComentario}
                    maxLength={250}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                />

                <TouchableOpacity style={styles.btnSalvar} onPress={salvarRegistro}>
                    <Text style={styles.textBtnSalvarFechar}>
                        {registroParaEditar ? "Salvar Alterações" : "Salvar Registro"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnFechar} onPress={() => { limparFormulario(); fecharModal(false); }}>
                    <Text style={styles.textBtnSalvarFechar}>Cancelar</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={modalDisciplinaAberto}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalDisciplinaAberto(false)}
            >
                <TouchableOpacity
                    style={styles.fundoModalSelect}
                    activeOpacity={1}
                    onPress={() => setModalDisciplinaAberto(false)}
                >
                    <View style={styles.conteudoModalSelect}>
                        <Text style={styles.tituloModalSelect}>Selecione a Disciplina</Text>
                        <ScrollView>
                            {listaDisciplinas.map((disc) => (
                                <TouchableOpacity
                                    key={disc.id}
                                    style={styles.optionItem}
                                    onPress={() => selecionarDisciplinaOption(disc.id, disc.nome)}
                                >
                                    <Text style={[styles.optionTexto, idDisciplinaSel === disc.id && styles.optionTextoSelecionado]}>
                                        {disc.nome}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={modalTopicoAberto}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalTopicoAberto(false)}
            >
                <TouchableOpacity
                    style={styles.fundoModalSelect}
                    activeOpacity={1}
                    onPress={() => setModalTopicoAberto(false)}
                >
                    <View style={styles.conteudoModalSelect}>
                        <Text style={styles.tituloModalSelect}>Selecione o Tópico</Text>
                        <ScrollView>
                            {topicosFiltrados.length === 0 ? (
                                <Text style={styles.txtSemDados}>Nenhum tópico cadastrado nesta disciplina.</Text>
                            ) : (
                                topicosFiltrados.map((itemTopico, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.optionItem}
                                        onPress={() => {
                                            setNomeTopicoSel(itemTopico);
                                            setModalTopicoAberto(false);
                                        }}
                                    >
                                        <Text style={[styles.optionTexto, nomeTopicoSel === itemTopico && styles.optionTextoSelecionado]}>
                                            {itemTopico}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        paddingBottom: 40,
    },
    container: {
        padding: 15,
    },
    titulo: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 15,
        color: '#1f2937'
    },
    labelOpcional: {
        fontSize: 14,
        fontWeight: '400',
        color: '#6b7280',
        fontStyle: 'italic',
    },
    select: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectDesabilitado: {
        backgroundColor: '#e5e7eb',
        borderColor: '#cbd5e1',
    },
    textoSelect: {
        fontSize: 15,
        color: '#374151',
    },
    linhaTempo: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputTempo: {
        width: 60,
        height: 50,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        textAlign: 'center',
        fontSize: 18,
        color: '#1f2937'
    },
    separador: {
        fontSize: 24,
        fontWeight: 'bold',
        marginHorizontal: 8,
    },
    containerTipos: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    botaoTipo: {
        width: '48%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: 'center',
        marginBottom: 10,
    },
    botaoSelecionado: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    textoBotao: {
        color: '#333',
        fontWeight: '500',
    },
    textoSelecionado: {
        color: '#fff',
        fontWeight: 'bold',
    },
    containerCondicional: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        borderRadius: 12,
        padding: 14,
        marginTop: 15,
    },
    labelCondicional: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e40af',
        marginBottom: 8,
    },
    inputNomeSimulado: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        color: '#1f2937'
    },
    linhaMetricas: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    blocoMetrica: {
        width: '48%',
    },
    subLabelMetrica: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: 4,
    },
    inputMetrica: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderRadius: 8,
        padding: 10,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937'
    },
    containerComentarioHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    contadorCaracteres: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
        marginTop: 15,
    },
    inputComentario: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        color: '#1f2937',
        height: 100,
        textAlignVertical: 'top',
        textAlign: 'justify',
    },
    btnSalvar: {
        backgroundColor: '#10B981',
        borderRadius: 10,
        paddingVertical: 15,
        marginTop: 25,
        alignItems: 'center',
    },
    btnFechar: {
        backgroundColor: '#EF4444',
        borderRadius: 10,
        paddingVertical: 15,
        marginTop: 12,
        alignItems: 'center',
        marginBottom: 30,
    },
    textBtnSalvarFechar: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    fundoModalSelect: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    conteudoModalSelect: {
        width: '85%',
        maxHeight: '60%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    tituloModalSelect: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#1f2937',
        textAlign: 'center'
    },
    optionItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    optionTexto: {
        fontSize: 16,
        color: '#4b5563',
    },
    optionTextoSelecionado: {
        color: '#3B82F6',
        fontWeight: 'bold',
    },
    txtSemDados: {
        textAlign: 'center',
        color: '#9ca3af',
        marginVertical: 20,
    }
});