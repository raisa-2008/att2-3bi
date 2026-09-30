import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  SafeAreaView, 
  ActivityIndicator 
} from 'react-native';
import { supabase } from './lib/supabase';

// Type que espelha a tabela do banco (null nos opcionais)
type Filme = {
  id: number;
  criado_em?: string;
  titulo: string;
  genero: string;
  ano: number;
  avaliacao: number | null;
};

export default function App() {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [carregando, setCarregando] = useState<boolean>(false);

  // Estados do formulário
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [titulo, setTitulo] = useState<string>('');
  const [genero, setGenero] = useState<string>('');
  const [ano, setAno] = useState<string>('');
  const [avaliacao, setAvaliacao] = useState<string>('');

  useEffect(() => {
    carregarFilmes();
  }, []);

  // READ: Listar registos
  const carregarFilmes = async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from('filmes')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      Alert.alert('Erro ao carregar', error.message);
    } else {
      setFilmes(data || []);
    }
    setCarregando(false);
  };

  // Limpar formulário
  const limparFormulario = () => {
    setIdEditando(null);
    setTitulo('');
    setGenero('');
    setAno('');
    setAvaliacao('');
  };

  // CREATE / UPDATE com Validação
  const salvarFilme = async () => {
    // Validação: Impedir texto obrigatório vazio
    if (!titulo.trim() || !genero.trim() || !ano.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Validação: Impedir texto em campo numérico
    const anoNumero = parseInt(ano, 10);
    if (isNaN(anoNumero)) {
      Alert.alert('Erro de validação', 'O campo "Ano" deve ser um número válido.');
      return;
    }

    const avaliacaoNumero = avaliacao.trim() !== '' ? parseFloat(avaliacao) : null;
    if (avaliacao.trim() !== '' && isNaN(avaliacaoNumero!)) {
      Alert.alert('Erro de validação', 'O campo "Avaliação" deve ser um número válido.');
      return;
    }

    if (idEditando !== null) {
      // UPDATE: Alterar registo existente filtrado por id
      const { error } = await supabase
        .from('filmes')
        .update({
          titulo,
          genero,
          ano: anoNumero,
          avaliacao: avaliacaoNumero
        })
        .eq('id', idEditando);

      if (error) {
        Alert.alert('Erro ao atualizar', error.message);
      } else {
        Alert.alert('Sucesso', 'Filme atualizado com sucesso!');
        limparFormulario();
        carregarFilmes();
      }
    } else {
      // CREATE: Inserir novo registo
      const { error } = await supabase
        .from('filmes')
        .insert([
          {
            titulo,
            genero,
            ano: anoNumero,
            avaliacao: avaliacaoNumero
          }
        ]);

      if (error) {
        Alert.alert('Erro ao inserir', error.message);
      } else {
        Alert.alert('Sucesso', 'Filme registado com sucesso!');
        limparFormulario();
        carregarFilmes();
      }
    }
  };

  // Preparar edição (preenche o formulário)
  const prepararEdicao = (item: Filme) => {
    setIdEditando(item.id);
    setTitulo(item.titulo);
    setGenero(item.genero);
    setAno(item.ano.toString());
    setAvaliacao(item.avaliacao !== null ? item.avaliacao.toString() : '');
  };

  // DELETE: Remover registo com confirmação
const deletarFilme = (id: number) => {
  const confirmar = window.confirm('Tem a certeza que deseja remover este filme?');
  if (confirmar) {
    supabase
      .from('filmes')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          alert('Erro ao eliminar: ' + error.message);
        } else {
          carregarFilmes();
        }
      });
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.tituloHeader}>Cadastro de Filmes</Text>

      {/* Formulário */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Título do Filme *"
          value={titulo}
          onChangeText={setTitulo}
        />
        <TextInput
          style={styles.input}
          placeholder="Gênero *"
          value={genero}
          onChangeText={setGenero}
        />
        <TextInput
          style={styles.input}
          placeholder="Ano de Lançamento *"
          keyboardType="numeric"
          value={ano}
          onChangeText={setAno}
        />
        <TextInput
          style={styles.input}
          placeholder="Avaliação (0 a 10)"
          keyboardType="numeric"
          value={avaliacao}
          onChangeText={setAvaliacao}
        />

        <View style={styles.botoesForm}>
          <TouchableOpacity style={styles.botaoSalvar} onPress={salvarFilme}>
            <Text style={styles.textoBotao}>
              {idEditando !== null ? 'Atualizar Filme' : 'Adicionar Filme'}
            </Text>
          </TouchableOpacity>

          {idEditando !== null && (
            <TouchableOpacity style={styles.botaoCancelar} onPress={limparFormulario}>
              <Text style={styles.textoBotao}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista de Filmes */}
      {carregando ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={filmes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.cardItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitulo}>{item.titulo} ({item.ano})</Text>
                <Text style={styles.itemSubtitulo}>Gênero: {item.genero}</Text>
                {item.avaliacao !== null && (
                  <Text style={styles.itemSubtitulo}>Nota: {item.avaliacao}</Text>
                )}
              </View>

              <View style={styles.acoesCard}>
                <TouchableOpacity 
                  style={styles.botaoEditar} 
                  onPress={() => prepararEdicao(item)}
                >
                  <Text style={styles.textoAcao}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.botaoDeletar} 
                  onPress={() => deletarFilme(item.id)}
                >
                  <Text style={styles.textoAcao}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16, paddingTop: 40 },
  tituloHeader: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  form: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, elevation: 2 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 10 },
  botoesForm: { flexDirection: 'row', gap: 10 },
  botaoSalvar: { flex: 1, backgroundColor: '#007bff', padding: 12, borderRadius: 6, alignItems: 'center' },
  botaoCancelar: { backgroundColor: '#6c757d', padding: 12, borderRadius: 6, alignItems: 'center' },
  textoBotao: { color: '#fff', fontWeight: 'bold' },
  cardItem: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  itemTitulo: { fontSize: 16, fontWeight: 'bold' },
  itemSubtitulo: { fontSize: 14, color: '#555' },
  acoesCard: { flexDirection: 'row', gap: 8 },
  botaoEditar: { backgroundColor: '#ffc107', padding: 8, borderRadius: 4 },
  botaoDeletar: { backgroundColor: '#dc3545', padding: 8, borderRadius: 4 },
  textoAcao: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});