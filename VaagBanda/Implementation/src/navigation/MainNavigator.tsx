import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text } from 'react-native'
import { colors } from '../theme/colors'
import HomeScreen from '../screens/home/HomeScreen'
import GroupsScreen from '../screens/groups/GroupsScreen'
import CreateGroupScreen from '../screens/groups/CreateGroupScreen'
import HistoryScreen from '../screens/expenses/HistoryScreen'
import ProfileScreen from '../screens/profile/ProfileScreen'
import GroupDetailScreen from '../screens/groups/GroupDetailScreen'
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen'
import SettleUpScreen from '../screens/expenses/SettleUpScreen'
import InviteMemberScreen from '../screens/groups/InviteMemberScreen'
import BillScannerScreen from '../screens/expenses/BillScannerScreen'
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen'

export type GroupStackParamList = {
  GroupsList: undefined
  CreateGroup: undefined
  GroupDetail: { groupId: string; groupName: string }
  AddExpense: { groupId: string; groupName: string; prefillTitle?: string; prefillAmount?: string }
  SettleUp: { groupId: string; groupName: string }
  InviteMember: { groupId: string; groupName: string }
  BillScanner: { groupId: string; groupName: string }
}

const Tab = createBottomTabNavigator()
const GroupStack = createNativeStackNavigator<GroupStackParamList>()

function GroupsNavigator() {
  return (
    <GroupStack.Navigator screenOptions={{ headerShown: false }}>
      <GroupStack.Screen name="GroupsList" component={GroupsScreen} />
      <GroupStack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <GroupStack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <GroupStack.Screen name="AddExpense" component={AddExpenseScreen} />
      <GroupStack.Screen name="SettleUp" component={SettleUpScreen} />
      <GroupStack.Screen name="InviteMember" component={InviteMemberScreen} />
      <GroupStack.Screen name="BillScanner" component={BillScannerScreen} />
    </GroupStack.Navigator>
  )
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsNavigator}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👥</Text> }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text> }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>📜</Text> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }}
      />
    </Tab.Navigator>
  )
}