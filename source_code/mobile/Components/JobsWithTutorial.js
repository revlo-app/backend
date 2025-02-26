import TutorialWrapper from "./TutorialWrapper";
import Jobs from "../Screens/Jobs";

const JobsWithTutorial = (props) => {
    return (
    <TutorialWrapper setTriggerEffect = {props.setTriggerEffect} setIsNewUser = {props.setIsNewUser} userId={props.userId} state={props.state} isNewUser={props.isNewUser}>
        <Jobs {...props} />
    </TutorialWrapper>
);

}

export default JobsWithTutorial;