import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import AddRegistro from '../addRegistro';

export default function Cronometro() {

    const [tempo, setTempo] = useState(0);
    const [rodando, setRodando] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        let intervalo: number | null | undefined;

        if (rodando) {
            intervalo = setInterval(() => {
                setTempo(prev => prev + 1);
            }, 1000);
        }

        return () => clearInterval(intervalo);
    }, [rodando]);

    const formatarTempo = () => {
        const horas = Math.floor(tempo / 3600);
        const minutos = Math.floor((tempo % 3600) / 60);
        const segundos = tempo % 60;

        return (
            String(horas).padStart(2, '0') + ':' +
            String(minutos).padStart(2, '0') + ':' +
            String(segundos).padStart(2, '0')
        );
    };

    const playPause = () => {
        setRodando(!rodando);
    };

    const resetar = () => {
        setTempo(0);
        setRodando(false);
    };

    return (
        <View style={styles.container}>

            <Text style={styles.textCronometro}>
                {formatarTempo()}
            </Text>

            <View style={styles.containerBtns}>

                <TouchableOpacity onPress={playPause}>
                    <Icon
                        style={[styles.botao, styles.play]}
                        name={rodando ? 'pause' : 'play-arrow'}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={resetar}>
                    <Icon
                        style={[styles.botao, styles.reset]}
                        name="refresh"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                        if (tempo > 0) {
                            setModalVisible(true);
                            setRodando(false)
                        }
                    }}
                >
                    <Icon
                        style={[styles.botao, styles.save]}
                        name="check"
                    />
                </TouchableOpacity>

            </View>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
            >
                <View style={styles.modal}>
                    <AddRegistro tempoEstudado={tempo} fecharModal={setModalVisible} reset={resetar} />
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 8,
    },

    textCronometro: {
        fontSize: 25,
        fontWeight: 'bold',
        marginBottom: 10,
    },

    containerBtns: {
        flexDirection: 'row',
    },

    botao: {
        borderRadius: 50,
        fontSize: 30,
        marginHorizontal: 10,
        color: '#FFFFFF',
        padding: 5,
    },

    play: {
        backgroundColor: '#3B82F6',
    },

    reset: {
        backgroundColor: '#EF4444',
    },

    save: {
        backgroundColor: '#10B981',
    },

    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },

    modal: {
        flex: 1,
        backgroundColor: 'white',
        marginTop: 50,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },

    modalText: {
        fontSize: 24,
        marginBottom: 20,
    },

    fechar: {
        fontSize: 18,
        color: 'blue',
    },
});