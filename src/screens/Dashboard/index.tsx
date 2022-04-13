import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, View, ActivityIndicator, Alert } from 'react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { HighlightCard } from '../../components/HighlightCard'
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard'
import { useTheme } from 'styled-components';
import {
  Container,
  Header,
  Icon,
  Photo,
  User,
  UserGreeting,
  UserInfo,
  UserName,
  UserWrapper,
  HighlightCards,
  Transactions,
  Title,
  LogoutButton,
  LoadContainer,
} from './styles'

export interface DataListProps extends TransactionCardProps {
  id: string;
}

interface HighlightProps {
  amount: string;
  lastTransaction: string;
}
interface HighlightData {
  entries: HighlightProps;
  expenses: HighlightProps;
  total: HighlightProps;
}

export function Dashboard() {

  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<DataListProps[]>([]);
  const [highlightData, setHighlightData] = useState<HighlightData>({} as HighlightData);

  const dataKey = "@kaelbank:transactions";
  const theme = useTheme();

  function getLastTransactionDate(
      collection: DataListProps[], 
      type: 'positive' | 'negative'
  ){
    const lastTransaction = new Date(
    Math.max.apply(Math, collection
    .filter(transaction => transaction.type === "positive")
    .map(transaction => new Date(transaction.date).getTime())));

    return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', { month: 'long' })}`;
  }

  async function loadTransactions() {
    
    const response = await AsyncStorage.getItem(dataKey);
    const transactions = response ? JSON.parse(response) : [];

    let entriesSum = 0;
    let expensesSum = 0;

    const transactionsFormatted: DataListProps[] = transactions
      .map((item: DataListProps) => {

        if (item.type === "positive") {
          entriesSum += Number(item.amount);
        } else {
          expensesSum += Number(item.amount);
        }

        const amount = Number(item.amount)
          .toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          })

        const date = Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        }).format(new Date(item.date));

        return {
          id: item.id,
          name: item.name,
          amount,
          type: item.type,
          category: item.category,
          date
        }
      });

    setTransactions(transactionsFormatted);

    const lastTransactionEntries = getLastTransactionDate(transactions, 'positive');
    const lastTransactionExpenses = getLastTransactionDate(transactions, 'negative');
    const totalInterval = `01 a ${lastTransactionExpenses}`;

    const total = entriesSum - expensesSum;

    setHighlightData({
      entries: {
        amount: entriesSum.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: `Última entrada dia ${lastTransactionEntries}`
      },
      expenses: {
        amount: expensesSum.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: `Última saída dia ${lastTransactionExpenses}`
      },
      total: {
        amount: total.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: totalInterval
      }
    });
    setIsLoading(false);
  }

  async function handleRemoveCard(transactionId: string) {
    const response = await AsyncStorage.getItem(dataKey);
    const storedTransactions = response ? JSON.parse(response) : [];
  
    const filteredTransactions = storedTransactions.filter((transaction: DataListProps) => transaction.id !== transactionId);
  
    setTransactions(filteredTransactions);
    await AsyncStorage.setItem(dataKey, JSON.stringify(filteredTransactions));

    loadTransactions()
  }
  function alerta(name: string, id: string,) {
    Alert.alert(`Você deseja deletar ${String(name)}?`,
    "",
    [
      {text: 'Cancelar', },
      {text: 'Deletar', onPress: () => handleRemoveCard(id) },
    ],
      {cancelable: false}
    )}

  useFocusEffect(useCallback(() => {
    loadTransactions();
  }, []));

  return (
    <Container>
      {
        isLoading ?
          <LoadContainer>
            <ActivityIndicator
              color={theme.colors.primary}
              size="large"
            />
          </LoadContainer> :
          <>
            <Header>
              <UserWrapper>
                <UserInfo>
                  <Photo source={{ uri: "https://lh3.googleusercontent.com/a-/AOh14GjIG7LBgeDuaKH7BDqzTsuhOcHib-4Q-RBw7vHY=s288-p-no" }} />
                  <User>
                    <UserGreeting>Olá, </UserGreeting>
                    <UserName>Michael</UserName>
                  </User>
                </UserInfo>
                <LogoutButton onPress={() => { }}>
                  <Icon name="power" />
                </LogoutButton>
              </UserWrapper>
            </Header>
            <ScrollView
              style={{
                // flex: 1,
                marginTop: RFPercentage(-17),
              }}
            >
              <View>

                <HighlightCards>
                  <HighlightCard
                    type="up"
                    title="Entradas"
                    amount={highlightData.entries.amount}
                    lastTransaction={highlightData.entries.lastTransaction} />
                  <HighlightCard
                    type="down"
                    title="Saídas"
                    amount={highlightData.expenses.amount}
                    lastTransaction={highlightData.expenses.lastTransaction}  />
                  <HighlightCard
                    type="total"
                    title="Total"
                    amount={highlightData.total.amount}
                    lastTransaction={highlightData.total.lastTransaction} />
                </HighlightCards>

                <Transactions>
                  <Title>Listagem</Title>
                  {transactions.map(item => (<TransactionCard onPress={ () => alerta(item.name, item.id)} key={item.id} data={item} />))}
                </Transactions>

              </View>

            </ScrollView>
          </>
      }
    </Container>
  )
}

