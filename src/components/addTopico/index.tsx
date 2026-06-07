import React, { useState, useEffect } from 'react';
import {
    TouchableOpacity,
    Text,
    View,
    StyleSheet,
    TextInput,
    Alert,
} from "react-native";
import { db } from '../../firebase';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface AddDisciplinasProps {
    acaoModal: React.Dispatch<React.SetStateAction<boolean>>;
    idDisciplina?: string;
    nomeInicial?: string;
    topicoAntigo?: string;
    atualizarLista: () => void;
}

export default function AddTopico({
    acaoModal,
    idDisciplina,
    nomeInicial,
    topicoAntigo,
    atualizarLista,
}: AddDisciplinasProps) {
    const [nomeTopico, setNomeTopico] = useState('');
    const [salvando, setSalvando] = useState(false);

    const auth = getAuth();

    useEffect(() => {
        if (nomeInicial) {
            setNomeTopico(nomeInicial);
        } else {
            setNomeTopico('');
        }
    }, [nomeInicial]);

    async function salvarTopico() {
        if (!nomeTopico.trim()) return;
        const usuarioLogado = auth.currentUser;
        if (!usuarioLogado) {
            Alert.alert("Erro", "Você precisa estar logado para gerenciar tópicos.");
            return;
        }

        if (!idDisciplina) {
            console.log("ID da disciplina não foi fornecido.");
            Alert.alert("Erro", "Disciplina inválida ou não encontrada.");
            return;
        }

        try {
            setSalvando(true);
            const disciplinaRef = doc(db, 'disciplinas', idDisciplina);

            if (topicoAntigo) {
                const docSnap = await getDoc(disciplinaRef);

                if (docSnap.exists()) {
                    const dados = docSnap.data();

                    if (dados.userId !== usuarioLogado.uid) {
                        Alert.alert("Erro de Permissão", "Você não tem autorização para alterar esta disciplina.");
                        return;
                    }

                    let listaTopicos: string[] = dados.topico || [];

                    listaTopicos = listaTopicos.map(t => t === topicoAntigo ? nomeTopico.trim() : t);

                    await updateDoc(disciplinaRef, {
                        topico: listaTopicos
                    });
                }
            } else {
                await updateDoc(disciplinaRef, {
                    topico: arrayUnion(nomeTopico.trim())
                });
            }

            atualizarLista();
            setNomeTopico('');
            acaoModal(false);

        } catch (erro) {
            Alert.alert("Erro", "Houve um problema ao salvar o tópico no Banco de Dados.");
        } finally {
            setSalvando(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>
                {topicoAntigo ? 'Editar Nome do Tópico' : 'Nome do Tópico'}
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Digite o nome do tópico"
                placeholderTextColor="#9ca3af"
                value={nomeTopico}
                onChangeText={setNomeTopico}
            />

            <TouchableOpacity
                style={[
                    styles.btnSalvar,
                    (!nomeTopico.trim() || salvando) && styles.btnDesabilitado
                ]}
                onPress={salvarTopico}
                disabled={!nomeTopico.trim() || salvando}
            >
                <Text style={styles.textoBotao}>
                    {salvando ? 'Salvando...' : topicoAntigo ? 'Editar Tópico' : 'Adicionar Tópico'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.btnFechar}
                onPress={() => acaoModal(false)}
            >
                <Text style={styles.textoBotao}>Fechar</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#000',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#000',
        marginBottom: 20,
    },
    btnSalvar: {
        backgroundColor: '#10B981',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    btnDesabilitado: {
        backgroundColor: '#6B7280',
    },
    btnFechar: {
        backgroundColor: '#EF4444',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    textoBotao: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});