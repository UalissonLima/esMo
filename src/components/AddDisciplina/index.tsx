import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import {
    collection,
    addDoc,
    doc,
    updateDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase';

interface AddDisciplinasProps {
    acaoModal: React.Dispatch<React.SetStateAction<boolean>>;
    idDisciplina?: string;
    nomeInicial?: string;
    atualizarLista: () => void;
}

export default function AddDisciplina({
    acaoModal,
    idDisciplina,
    nomeInicial,
    atualizarLista,
}: AddDisciplinasProps) {
    const auth = getAuth();
    const [nomeDisciplina, setNomeDisciplina] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (nomeInicial) {
            setNomeDisciplina(nomeInicial);
        } else {
            setNomeDisciplina('');
        }
    }, [nomeInicial]);

    async function salvarDisciplina() {
        if (!nomeDisciplina.trim()) {
            return;
        }

        const usuarioLogado = auth.currentUser;
        if (!usuarioLogado) {
            Alert.alert("Erro", "Você precisa estar logado para salvar uma disciplina.");
            return;
        }

        try {
            setSalvando(true);

            if (idDisciplina) {
                await updateDoc(
                    doc(db, 'disciplinas', idDisciplina),
                    {
                        nome: nomeDisciplina.trim(),
                    }
                );
            } else {
                await addDoc(
                    collection(db, 'disciplinas'),
                    {
                        userId: usuarioLogado.uid,
                        nome: nomeDisciplina.trim(),
                        criadoEm: new Date(),
                        topico: [],
                    }
                );
            }

            atualizarLista();
            acaoModal(false);

        } catch (erro) {
            console.log(erro);
            Alert.alert("Erro", "Não foi possível salvar a disciplina.");
        } finally {
            setSalvando(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>
                Nome da Disciplina
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Digite o nome da disciplina"
                value={nomeDisciplina}
                onChangeText={setNomeDisciplina}
            />

            <TouchableOpacity
                style={[
                    styles.btnSalvar,
                    (!nomeDisciplina.trim() || salvando) &&
                    styles.btnDesabilitado
                ]}
                onPress={salvarDisciplina}
                disabled={!nomeDisciplina.trim() || salvando}
            >
                <Text style={styles.textoBotao}>
                    {salvando
                        ? 'Salvando...'
                        : idDisciplina
                            ? 'Editar Disciplina'
                            : 'Salvar Disciplina'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.btnFechar}
                onPress={() => acaoModal(false)}
            >
                <Text style={styles.textoBotao}>
                    Fechar
                </Text>
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