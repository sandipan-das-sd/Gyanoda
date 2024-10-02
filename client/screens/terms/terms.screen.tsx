import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function TermsAndConditions() {
  const navigation = useNavigation();
  const termsText = `Gyanoda
✦TERMS AND CONDITIONS✦
Our App provides Users with access to compiled educational information and related sources. Such information is provided on an As Is basis and We assume no liability for the accuracy or completeness or use or non-obsolescence of such information. We shall not be liable to update or ensure continuity of such information contained on the App. We would not be responsible for any errors, which might appear in such information, which is compiled from third party sources or for any unavailability of such information. That any modification or change in facts may occur and shall be the responsibility of the third parties involved to provide necessary methods or answers.

✦ USER TERMS & CONDITIONS:
1.One user upon acceptance and agreeing to the terms and conditions herein below shall accept and be bound with the terms and conditions as set forth and any violation of the same shall be equivocally treated as breach of contract herein.

2.That the user shall by validating his phone number and email and shall register within the App to avail the necessary educational information and materials available, upon paying the fees as admissible through the Company.

3.That the User upon non satisfaction or other clauses may ask for any refund and that no refund system is available herein.That no compensation or money back is available with the platform and that no such claim shall be entertained.

4.Users cannot log in as educators or third parties or other fake identity or multiple accounts and cannot engage in any business activities using the platform.

5.The Gyanoda will not call any user and ask for an OTP. Users are advised not to share their personal details with anyone on the platform. That as per the mechanism of software as held by the company the user ID is mapped with the phone number but not the phone. So, if a user loses their phone but still recovers the SIM, they can log in with the same ID. If unable to recover the SIM, the user has to register again.

6.That the user once creates the App cannot share his or her ID with any other users. If found otherwise, legal action will be taken. That all information, content, material, trademarks, services marks, trade names, and trade secrets including but not limited to the software, text, images, graphics, video, script and audio, contained in the Application, App, Services and products are proprietary property of the Company (“Proprietary Information”). That if any user or otherwise is found monetising upon the contents and materials within the App then the same shall be held punishable under the breach of contract vide Indian Contract Act,1872 and relevant criminal provisions shall apply.

7.No Proprietary Information may be copied, downloaded, reproduced, modified, republished, uploaded, posted, transmitted or distributed in any way without obtaining prior written permission from the Company and nothing on this Application or App or Services shall be or products deemed to confer a license of or any other right, interest or title to or in any of the intellectual property rights belonging to the Company, to the User. Users are strictly prohibited from creating and publicly sharing any videos generated using AI technology that may cause harm, misinformation, or any form of disturbance. Violations may lead to legal consequences. Recording of the videos is not permissible on this platform, and recording or causing duplicate profiles to circulate the exclusive contents in a public domain shall be treated as breach of contract and appropriate damages and compensation shall be claimed.

8.You may own the medium on which the information, content or materials resides, but the Company shall at all times retain full and complete title to the information, content or materials and all intellectual property rights inserted by the Company on such medium and shall be as a binding contract. Certain contents on the App may belong to third parties. Such contents have been reproduced after taking prior consent from said party and all rights relating to such content will remain with such third party. Further, you recognize and acknowledge that the ownership of all trademarks, copyright, logos, service marks and other intellectual property owned by any third party or of the Company shall continue to vest with such party and You are not permitted to use the same without the consent of the respective Company.

✦EDUCATOR TERMS & CONDITIONS:
1.Once the educator enters into the agreement with the Gyanoda then they are bound by the rules and agreement as made between the parties. That the educational material prepared in any medium/by script or by video is and shall be made by the educator upon consent and acceptance with the terms as laid by Gyanoda. Once educator uploads their content to our platform, then the Gyanoda team has the right to use that video for any future reference. That all videos and materials curated and created are as per the remuneration paid to educator to conclusively shoot and send the videos to the Gyanoda. That educator shall be bound the provisions of Copyright Act,1872 and the relevant amendment provisions.

2.The Gyanoda being the sole owner and proprietor of the contents shall have the absolute right to remove or delete videos of educators if the content is not relevant or good.

3.The Educators shall be bound to share their original videos; they cannot copy content from other Apps, for example, using content from platforms like "XYZ Learning/Academy/Platform or any app."

4.That the Educators cannot use any rough language/abusive language/behaviour dressing sense or engage in inappropriate behaviour with the users/ students while clearing doubts.

5.Educators and the Gyanoda team will mutually decide on the pricing for the content. Educators cannot charge exorbitant prices from users. They shall be bound by the monetary aspects as per the agreement.

6.If any educators want to upload their content, they have to request it first in the app. If the request is accepted by the Gyanoda, then they can upload content. All relevant instructions will be sent by the Gyanoda itself.

7.That the educators cannot engage in business using our domain and server, reveal any relevant security data, or engage in any business activities that involve the platform. That the users cannot be engaged to any private tuition or education through one-to-one source which is violative of the contract and the same if found shall be punishable as breach of contract. Educators cannot log in as users and cannot sell courses intended for user use or make any miscreance use of the same.

8.In no event shall the Company, its officers, directors, employees, partners or agents be liable to You or any third party for any special, incidental, indirect, consequential or punitive damages whatsoever, including those resulting from loss of use, data or profits or any other claim arising out, of or in connection with, Your use of, or access to, the Application.

✦LEGAL CONSEQUENCES
1.In the event of Your breach of these Terms, You agree that the Company will be irreparably harmed and may not have an adequate remedy in money or damages. The Company therefore, shall be entitled in such event to obtain an injunction against such a breach from any court of competent jurisdiction. The Company's right to obtain such relief shall not limit its right to obtain other remedies.
2.Any violation by You of the terms of this Clause may result in immediate suspension or termination of Your Accounts apart from any legal remedy that the Company can avail. In such instances, the Company may also disclose Your Account Information if required by any Governmental or legal authority. You understand that the violation of these Terms could also result in civil or criminal liability under applicable laws.
3.The Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles. Further, the Terms shall be subject to the exclusive jurisdiction of the competent courts located in Kolkata and You hereby accede to and accept the jurisdiction of such courts. That the company shall hold you liable of the equitable remedies of the Copyright Act,1872, and Indian Penal Code,1860 and all other acts and amendments or other legal provisions of law to protect and safeguard our companies right.

✦RIGHTS HELD BY COMPANY
The Company has the right to change modify, suspend, or discontinue and/or eliminate any aspect(s), features or functionality of the Application or the Services as it deems fit at any time without notice. Further, the Company has the right to amend these Terms from time to time without prior notice to you. The Company makes no commitment, express or implied, to maintain or continue any aspect of the Application. You agree that the Company shall not be liable to You or any third party for any modification, suspension or discontinuance of the Application/Services. All prices are subject to change without notice. 
`;

  const [showMore, setShowMore] = React.useState(false);

  return (
    <LinearGradient
      colors={["#E5ECF9", "#F6F7F9"]}
      style={{ flex: 1, paddingTop: 20 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.text}>
          {showMore ? termsText : `${termsText.substring(0, 1200)}...`}
        </Text>
        <TouchableOpacity onPress={() => setShowMore(!showMore)}>
          <Text style={styles.showMore}>
            {showMore ? "Show Less" : "Show More"}
            {showMore ? "-" : "+"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  text: {
    color: "#1A1A1A",
    fontSize: 16,
    lineHeight: 24,
  },
  showMore: {
    color: "#8D8D8D",
    marginTop: 10,
    fontSize: 14,
  },
});
