import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
const { width } = Dimensions.get('window');

interface MenuInferiorProps {
    abaAtiva: 'home' | 'disciplinas' | 'historico';
    aoMudarAba: (aba: 'home' | 'disciplinas' | 'historico') => void;
}

export default function MenuInferior({ abaAtiva, aoMudarAba }: MenuInferiorProps) {
    return (
        <View style={styles.containerMenu}>
            <TouchableOpacity
                style={styles.botaoMenu}
                onPress={() => aoMudarAba('home')}
                activeOpacity={0.7}
            >
                <Feather
                    name="home"
                    size={24}
                    color={abaAtiva === 'home' ? '#3B82F6' : '#6B7280'}
                />
                <Text style={[
                    styles.txtMenu,
                    { color: abaAtiva === 'home' ? '#3B82F6' : '#6B7280', fontWeight: abaAtiva === 'home' ? 'bold' : 'normal' }
                ]}>
                    Home
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.botaoMenu}
                onPress={() => aoMudarAba('disciplinas')}
                activeOpacity={0.7}
            >
                <Feather
                    name="book-open"
                    size={24}
                    color={abaAtiva === 'disciplinas' ? '#3B82F6' : '#6B7280'}
                />
                <Text style={[
                    styles.txtMenu,
                    { color: abaAtiva === 'disciplinas' ? '#3B82F6' : '#6B7280', fontWeight: abaAtiva === 'disciplinas' ? 'bold' : 'normal' }
                ]}>
                    Disciplinas
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.botaoMenu}
                onPress={() => aoMudarAba('historico')}
                activeOpacity={0.7}
            >
                <Feather
                    name="clock"
                    size={24}
                    color={abaAtiva === 'historico' ? '#3B82F6' : '#6B7280'}
                />
                <Text style={[
                    styles.txtMenu,
                    { color: abaAtiva === 'historico' ? '#3B82F6' : '#6B7280', fontWeight: abaAtiva === 'historico' ? 'bold' : 'normal' }
                ]}>
                    Histórico
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    containerMenu: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        width: width,
        height: 65,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 8,
    },
    botaoMenu: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    txtMenu: {
        fontSize: 11,
        marginTop: 4,
    },
});