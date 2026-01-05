/**
 * First Aid Detail Screen
 *
 * Displays comprehensive first aid instructions for specific emergency types
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";

// Complete first aid data with medical instructions
const FIRST_AID_DATA: { [key: string]: FirstAidContent } = {
  cpr: {
    id: 'cpr',
    title: 'CPR (Cardiopulmonary Resuscitation)',
    icon: 'heart',
    color: '#EF4444',
    description: 'CPR can save lives during cardiac arrest. Follow these steps carefully.',
    whenToUse: [
      'Person is unconscious',
      'Not breathing or only gasping',
      'No pulse detected',
      'Cardiac arrest suspected',
    ],
    steps: [
      {
        number: 1,
        title: 'Check Responsiveness',
        details: 'Tap the person\'s shoulder and shout "Are you okay?" If no response, proceed immediately.',
      },
      {
        number: 2,
        title: 'Call for Emergency Help',
        details: 'Call 911 or local emergency number. If someone is nearby, have them call while you start CPR.',
      },
      {
        number: 3,
        title: 'Position the Person',
        details: 'Place the person on their back on a firm, flat surface. Tilt head back slightly to open airway.',
      },
      {
        number: 4,
        title: 'Hand Placement',
        details: 'Place heel of one hand on center of chest (lower half of breastbone). Place other hand on top, interlacing fingers.',
      },
      {
        number: 5,
        title: 'Chest Compressions',
        details: 'Push hard and fast at least 2 inches deep. Compress at rate of 100-120 compressions per minute (think "Stayin\' Alive" by Bee Gees).',
      },
      {
        number: 6,
        title: 'Give 30 Compressions',
        details: 'Count out loud. Allow chest to fully recoil between compressions. Keep your arms straight.',
      },
      {
        number: 7,
        title: 'Give 2 Rescue Breaths (if trained)',
        details: 'Tilt head back, lift chin. Pinch nose shut. Make complete seal over mouth and blow for 1 second. Watch for chest rise. Repeat.',
      },
      {
        number: 8,
        title: 'Continue Cycles',
        details: 'Continue 30 compressions and 2 breaths. Don\'t stop until: person shows signs of life, AED arrives, or emergency help takes over.',
      },
    ],
    warnings: [
      'Do NOT stop compressions unless person starts breathing',
      'Push hard enough to compress chest 2 inches',
      'If untrained, perform hands-only CPR (compressions only)',
      'Continue until help arrives - don\'t give up',
    ],
  },
  choking: {
    id: 'choking',
    title: 'Choking (Heimlich Maneuver)',
    icon: 'hand-left',
    color: '#F59E0B',
    description: 'Act quickly when someone is choking. Time is critical.',
    whenToUse: [
      'Person cannot breathe, speak, or cough',
      'Clutching throat with hands',
      'Face turning blue or red',
      'Unconscious from choking',
    ],
    steps: [
      {
        number: 1,
        title: 'Identify Choking Signs',
        details: 'Universal choking sign: hands clutching throat. Person cannot speak or cough effectively.',
      },
      {
        number: 2,
        title: 'Ask "Are You Choking?"',
        details: 'If person can speak or cough forcefully, encourage coughing. If they cannot speak, proceed immediately.',
      },
      {
        number: 3,
        title: 'Position Yourself',
        details: 'Stand behind person. Wrap arms around waist. Position one leg between their legs for stability.',
      },
      {
        number: 4,
        title: 'Make a Fist',
        details: 'Make fist with one hand. Place thumb side against abdomen, slightly above navel and below ribcage.',
      },
      {
        number: 5,
        title: 'Grasp Fist',
        details: 'Grasp fist with other hand. Hold firmly.',
      },
      {
        number: 6,
        title: 'Perform Abdominal Thrusts',
        details: 'Press fist into abdomen with quick, upward thrust. Use significant force. Repeat 5 times.',
      },
      {
        number: 7,
        title: 'Check for Obstruction',
        details: 'After 5 thrusts, check if object is dislodged. If still choking, repeat thrusts.',
      },
      {
        number: 8,
        title: 'If Person Becomes Unconscious',
        details: 'Lower person to ground carefully. Call 911. Begin CPR starting with chest compressions (this may dislodge object).',
      },
    ],
    warnings: [
      'Do NOT perform on someone who can cough or speak',
      'For pregnant/obese individuals: use chest thrusts instead',
      'For infants: use back blows and chest thrusts (different technique)',
      'Call 911 if object doesn\'t come out after several attempts',
    ],
  },
  bleeding: {
    id: 'bleeding',
    title: 'Severe Bleeding Control',
    icon: 'water',
    color: '#DC2626',
    description: 'Control severe bleeding quickly to prevent shock and save lives.',
    whenToUse: [
      'Blood spurting or flowing continuously',
      'Wound that won\'t stop bleeding',
      'Blood soaking through bandages',
      'Amputation or deep cuts',
    ],
    steps: [
      {
        number: 1,
        title: 'Ensure Scene Safety',
        details: 'Protect yourself. Wear gloves if available. Avoid contact with blood.',
      },
      {
        number: 2,
        title: 'Call 911 Immediately',
        details: 'For severe bleeding, call emergency services right away. Begin treatment while help is coming.',
      },
      {
        number: 3,
        title: 'Apply Direct Pressure',
        details: 'Place clean cloth, gauze, or even your hand directly on wound. Press firmly and continuously.',
      },
      {
        number: 4,
        title: 'Maintain Pressure',
        details: 'Do NOT lift cloth to check if bleeding stopped - this disrupts clot formation. Add more cloth if blood soaks through.',
      },
      {
        number: 5,
        title: 'Elevate If Possible',
        details: 'If no fracture suspected, raise injured area above heart level while maintaining pressure.',
      },
      {
        number: 6,
        title: 'Apply Pressure Bandage',
        details: 'Once bleeding slows, wrap bandage firmly over cloth. Tight enough to control bleeding but not cut off circulation.',
      },
      {
        number: 7,
        title: 'Check Circulation',
        details: 'Ensure fingers/toes beyond bandage remain pink and warm. Loosen if they turn blue or cold.',
      },
      {
        number: 8,
        title: 'Treat for Shock',
        details: 'Keep person lying down. Cover with blanket. Monitor breathing. Reassure victim.',
      },
    ],
    warnings: [
      'Do NOT remove embedded objects - stabilize them instead',
      'Do NOT use tourniquet unless trained (last resort only)',
      'Do NOT clean wound initially - focus on stopping bleeding',
      'Watch for signs of shock: pale skin, rapid pulse, confusion',
    ],
  },
  burns: {
    id: 'burns',
    title: 'Burn Treatment',
    icon: 'flame',
    color: '#F97316',
    description: 'Proper burn treatment prevents infection and reduces scarring.',
    whenToUse: [
      'Thermal burns (fire, hot liquids)',
      'Chemical burns',
      'Electrical burns',
      'First, second, or third-degree burns',
    ],
    steps: [
      {
        number: 1,
        title: 'Stop the Burning Process',
        details: 'Remove person from heat source. Put out flames (stop, drop, roll). Remove hot clothing unless stuck to skin.',
      },
      {
        number: 2,
        title: 'Assess Burn Severity',
        details: '1st degree: Red, painful. 2nd degree: Blisters, severe pain. 3rd degree: White/charred, may not hurt (nerve damage). Call 911 for 2nd/3rd degree.',
      },
      {
        number: 3,
        title: 'Cool the Burn',
        details: 'Run cool (not ice cold) water over burn for 10-20 minutes. For chemical burns, flush for 20+ minutes.',
      },
      {
        number: 4,
        title: 'Remove Jewelry/Tight Items',
        details: 'Remove rings, bracelets, belts before swelling starts. Do NOT remove clothing stuck to burn.',
      },
      {
        number: 5,
        title: 'Cover Burn',
        details: 'Use sterile, non-stick bandage or clean cloth. Do NOT use cotton balls or fluffy materials.',
      },
      {
        number: 6,
        title: 'Protect Blisters',
        details: 'Do NOT pop blisters - they protect against infection. If blister breaks, clean gently with water.',
      },
      {
        number: 7,
        title: 'Take Pain Reliever',
        details: 'Over-the-counter pain medication (ibuprofen, acetaminophen) can help with pain.',
      },
      {
        number: 8,
        title: 'Monitor for Infection',
        details: 'Watch for: increased pain, redness, swelling, pus, fever. Seek medical help if signs appear.',
      },
    ],
    warnings: [
      'Do NOT apply ice directly - can cause frostbite',
      'Do NOT use butter, oil, or ointments on serious burns',
      'Do NOT break blisters',
      'Seek immediate medical help for burns on face, hands, feet, genitals, or large burns',
    ],
  },
  fractures: {
    id: 'fractures',
    title: 'Fractures & Broken Bones',
    icon: 'body',
    color: '#92400E',
    description: 'Immobilize and protect broken bones until professional help arrives.',
    whenToUse: [
      'Visible bone deformity',
      'Severe pain that worsens with movement',
      'Swelling and bruising',
      'Inability to move or bear weight',
    ],
    steps: [
      {
        number: 1,
        title: 'Do NOT Move Person',
        details: 'If neck, back, or hip injury suspected, do NOT move person unless in immediate danger. Call 911.',
      },
      {
        number: 2,
        title: 'Call Emergency Services',
        details: 'For severe fractures, compound fractures (bone through skin), or spine injuries, call 911 immediately.',
      },
      {
        number: 3,
        title: 'Control Bleeding',
        details: 'If bone breaks through skin (compound fracture), cover with sterile bandage. Do NOT try to push bone back in.',
      },
      {
        number: 4,
        title: 'Immobilize the Injury',
        details: 'Prevent movement of injured area. Splint in position found - do NOT try to straighten.',
      },
      {
        number: 5,
        title: 'Apply Splint',
        details: 'Use rigid items (cardboard, rolled newspaper, sticks) to support injury. Pad with soft material. Extend splint past joints above and below fracture.',
      },
      {
        number: 6,
        title: 'Secure Splint',
        details: 'Tie splint with bandages, cloth strips, or tape. Not too tight - check circulation. Should be snug but not cutting off blood flow.',
      },
      {
        number: 7,
        title: 'Apply Ice',
        details: 'Put ice pack wrapped in cloth on injured area to reduce swelling and pain. 20 minutes on, 20 minutes off.',
      },
      {
        number: 8,
        title: 'Treat for Shock',
        details: 'Keep person calm and still. Cover with blanket. Elevate legs slightly (if no spine injury).',
      },
    ],
    warnings: [
      'Do NOT try to realign bone or push bone back in',
      'Do NOT move person if spine injury suspected',
      'Do NOT give person anything to eat or drink (may need surgery)',
      'Check circulation frequently - loosen splint if extremity turns blue or cold',
    ],
  },
  seizures: {
    id: 'seizures',
    title: 'Seizure Response',
    icon: 'warning',
    color: '#EAB308',
    description: 'Protect person during seizure and know when to call for emergency help.',
    whenToUse: [
      'Person having convulsions',
      'Loss of consciousness with shaking',
      'Stiffening and jerking movements',
      'Known epilepsy or first-time seizure',
    ],
    steps: [
      {
        number: 1,
        title: 'Stay Calm',
        details: 'Most seizures stop on their own within 1-3 minutes. Your role is to keep person safe.',
      },
      {
        number: 2,
        title: 'Clear the Area',
        details: 'Move furniture, sharp objects, and hard items away from person. Create safe space around them.',
      },
      {
        number: 3,
        title: 'Protect the Head',
        details: 'Place something soft under head (jacket, pillow, folded blanket). Prevent head from hitting ground.',
      },
      {
        number: 4,
        title: 'Turn Person on Side',
        details: 'Gently roll person onto side (recovery position). This allows saliva to drain and keeps airway open.',
      },
      {
        number: 5,
        title: 'Loosen Tight Clothing',
        details: 'Loosen tie, collar, or anything around neck. Remove glasses if worn.',
      },
      {
        number: 6,
        title: 'Time the Seizure',
        details: 'Note when seizure starts and ends. If lasts longer than 5 minutes, call 911.',
      },
      {
        number: 7,
        title: 'Stay with Person',
        details: 'Do NOT leave person alone. Stay until they are fully conscious and aware of surroundings.',
      },
      {
        number: 8,
        title: 'After Seizure Ends',
        details: 'Person may be confused or tired. Speak calmly and reassure them. Let them rest. Do NOT offer food/drink until fully alert.',
      },
    ],
    warnings: [
      'Do NOT put anything in person\'s mouth',
      'Do NOT restrain person or try to stop movements',
      'Do NOT give water, food, or medication until fully conscious',
      'Call 911 if: seizure lasts >5 minutes, multiple seizures, person is injured, pregnant, or first-time seizure',
    ],
  },
};

interface FirstAidStep {
  number: number;
  title: string;
  details: string;
}

interface FirstAidContent {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  whenToUse: string[];
  steps: FirstAidStep[];
  warnings: string[];
}

export default function FirstAidDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const categoryId = params.id as string;

  const content = FIRST_AID_DATA[categoryId];

  if (!content) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.danger} />
          <Text style={styles.errorText}>First aid information not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/community/first-aid')}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: content.color }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/community/first-aid')} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name={content.icon as any} size={48} color={Colors.textWhite} />
          <Text style={styles.headerTitle}>{content.title}</Text>
          <Text style={styles.headerSubtitle}>{content.description}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* When to Use Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color={content.color} />
            <Text style={styles.sectionTitle}>When to Use</Text>
          </View>
          {content.whenToUse.map((item, index) => (
            <View key={index} style={styles.bulletItem}>
              <View style={[styles.bulletDot, { backgroundColor: content.color }]} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Step-by-Step Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={24} color={content.color} />
            <Text style={styles.sectionTitle}>Step-by-Step Instructions</Text>
          </View>

          {content.steps.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={[styles.stepNumber, { backgroundColor: content.color }]}>
                <Text style={styles.stepNumberText}>{step.number}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDetails}>{step.details}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Warnings Section */}
        <View style={[styles.section, styles.warningSection]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning" size={24} color={Colors.danger} />
            <Text style={[styles.sectionTitle, { color: Colors.danger }]}>Important Warnings</Text>
          </View>
          {content.warnings.map((warning, index) => (
            <View key={index} style={styles.warningItem}>
              <Ionicons name="alert-circle" size={20} color={Colors.danger} />
              <Text style={styles.warningText}>{warning}</Text>
            </View>
          ))}
        </View>

        {/* Emergency Call Button */}
        <TouchableOpacity style={styles.emergencyButton}>
          <Ionicons name="call" size={24} color={Colors.textWhite} />
          <Text style={styles.emergencyButtonText}>Call Emergency: 911</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  backIcon: {
    position: 'absolute',
    top: 50,
    left: Spacing.lg,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textWhite,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textWhite,
    marginTop: Spacing.xs,
    textAlign: 'center',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  stepCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepDetails: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  warningSection: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: '#991B1B',
    lineHeight: 20,
    fontWeight: '500',
  },
  emergencyButton: {
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  emergencyButtonText: {
    color: Colors.textWhite,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: Colors.textWhite,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
