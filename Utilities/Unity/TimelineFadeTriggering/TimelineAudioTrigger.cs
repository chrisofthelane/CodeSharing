using UnityEngine;

public class TimelineAudioTrigger : MonoBehaviour
{
    [SerializeField] private FadingAudio fadingAudio;

    private void OnEnable()
    {
        fadingAudio.FadeIn();
    }

    private void OnDisable()
    {
        fadingAudio.FadeOut();
    }
}
